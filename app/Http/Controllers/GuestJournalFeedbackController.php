<?php

namespace App\Http\Controllers;

use App\Services\JournalFeedbackComposer;
use App\Support\JournalTemplateCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GuestJournalFeedbackController extends Controller
{
    private const SECTION_TEXT_MAX = 500;

    public function __construct(
        private JournalFeedbackComposer $feedbackComposer,
    ) {
    }

    public function store(Request $request)
    {
        $input = $request->all();

        if (! array_key_exists('sections_json', $input) && array_key_exists('sections', $input)) {
            $input['sections_json'] = $input['sections'];
        }

        $templates = JournalTemplateCatalog::templates();
        $allowedSlugs = array_merge(array_keys($templates), [JournalTemplateCatalog::CUSTOM_SLUG]);

        $validator = Validator::make($input, [
            'date' => ['nullable', 'date'],
            'template_slug' => ['required', 'string', Rule::in($allowedSlugs)],
            'sections_json' => ['required', 'array', 'min:1'],
            'sections_json.*.key' => ['required', 'string'],
            'sections_json.*.value' => ['nullable', 'string', 'max:'.self::SECTION_TEXT_MAX],
            'sections_json.*.text' => ['nullable', 'string', 'max:'.self::SECTION_TEXT_MAX],
            'sections_json.*.title_en' => ['nullable', 'string'],
            'sections_json.*.title_ja' => ['nullable', 'string'],
            'sections_json.*.labelEn' => ['nullable', 'string'],
            'sections_json.*.labelJa' => ['nullable', 'string'],
        ], [
            'sections_json.*.value.max' => '各セクションは'.self::SECTION_TEXT_MAX.'文字以内で入力してください。',
            'sections_json.*.text.max' => '各セクションは'.self::SECTION_TEXT_MAX.'文字以内で入力してください。',
        ]);

        $validator->after(function ($validator) use ($templates) {
            $data = $validator->getData();
            $templateSlug = (string) ($data['template_slug'] ?? '');
            $template = $templates[$templateSlug] ?? null;
            $sections = $data['sections_json'] ?? [];

            if ($template) {
                $expectedKeys = collect($template['sections'] ?? [])
                    ->pluck('key')
                    ->values()
                    ->all();
                $submittedKeys = collect($sections)
                    ->pluck('key')
                    ->values()
                    ->all();

                if (count($expectedKeys) !== count($submittedKeys)
                    || array_diff($expectedKeys, $submittedKeys)
                    || array_diff($submittedKeys, $expectedKeys)
                ) {
                    $validator->errors()->add('sections_json', 'セクション構成がテンプレートと一致しません。');
                }
            } else {
                $submittedKeys = collect($sections)
                    ->pluck('key')
                    ->filter()
                    ->values()
                    ->all();

                if (count($submittedKeys) !== count(array_unique($submittedKeys))) {
                    $validator->errors()->add('sections_json', 'セクションキーが重複しています。');
                }
            }

            $hasContent = collect($sections)->contains(function ($section) {
                $value = $section['value'] ?? $section['text'] ?? '';
                return trim((string) $value) !== '';
            });

            if (! $hasContent) {
                $validator->errors()->add('sections_json', '少なくとも1つのセクションに入力してください。');
            }
        });

        $validated = $validator->validate();
        $templateSlug = (string) $validated['template_slug'];
        $template = $templates[$templateSlug] ?? null;
        $sectionsInput = $validated['sections_json'] ?? [];

        if ($template) {
            $valuesByKey = collect($sectionsInput)
                ->mapWithKeys(fn ($section) => [
                    $section['key'] ?? '' => $section['value'] ?? $section['text'] ?? '',
                ]);

            $sections = collect($template['sections'] ?? [])
                ->map(function (array $section) use ($valuesByKey) {
                    return [
                        'key' => $section['key'] ?? '',
                        'title_en' => $section['title_en'] ?? null,
                        'title_ja' => $section['title_ja'] ?? null,
                        'placeholder_en' => $section['placeholder_en'] ?? null,
                        'placeholder_ja' => $section['placeholder_ja'] ?? null,
                        'order' => $section['order'] ?? 0,
                        'input_type' => $section['input_type'] ?? 'textarea',
                        'value' => (string) $valuesByKey->get($section['key'] ?? '', ''),
                    ];
                })
                ->values()
                ->all();
        } else {
            $sections = $this->normalizeSections($sectionsInput);
        }

        $feedbackPayload = $this->feedbackComposer->build($sections);

        return response()->json([
            'entry' => [
                'id' => 0,
                'date' => (string) ($validated['date'] ?? now()->toDateString()),
                'sections' => $sections,
                'feedback' => [
                    'english_text' => $feedbackPayload['feedback']['english_text'] ?? null,
                    'feedback_overall' => $feedbackPayload['feedback']['feedback_overall'] ?? null,
                    'feedback_corrections' => $feedbackPayload['feedback']['feedback_corrections_json'] ?? [],
                    'key_phrase_en' => $feedbackPayload['feedback']['key_phrase_en'] ?? null,
                    'key_phrase_ja' => $feedbackPayload['feedback']['key_phrase_ja'] ?? null,
                    'key_phrase_reason_ja' => $feedbackPayload['feedback']['key_phrase_reason_ja'] ?? null,
                ],
                'feedbackStatus' => $feedbackPayload['feedbackStatus'],
            ],
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $sections
     * @return array<int, array<string, mixed>>
     */
    private function normalizeSections(array $sections): array
    {
        if ($sections === []) {
            return [];
        }

        return collect($sections)
            ->map(function (array $section, int $index) {
                $name = (string) ($section['name'] ?? 'section');
                $key = (string) ($section['key'] ?? Str::snake($name));
                $labelEn = $section['title_en'] ?? $section['labelEn'] ?? $name;
                $labelJa = $section['title_ja'] ?? $section['labelJa'] ?? null;

                return [
                    'key' => $key,
                    'title_en' => $labelEn,
                    'title_ja' => $labelJa,
                    'placeholder_en' => null,
                    'placeholder_ja' => null,
                    'order' => $section['order'] ?? ($index + 1),
                    'input_type' => $section['input_type'] ?? 'textarea',
                    'value' => (string) ($section['value'] ?? $section['text'] ?? ''),
                ];
            })
            ->values()
            ->all();
    }
}
