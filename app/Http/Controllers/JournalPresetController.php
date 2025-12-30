<?php

namespace App\Http\Controllers;

use App\Models\JournalPreset;
use App\Support\JournalTemplateCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JournalPresetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $templates = JournalTemplateCatalog::templatesForUser($user);
        $activeSlug = JournalTemplateCatalog::resolveActiveSlug(
            $user?->journal_template_slug,
            $templates
        );

        return response()->json([
            'presets' => array_values($templates),
            'customPreset' => $templates[JournalTemplateCatalog::CUSTOM_SLUG] ?? null,
            'activePresetSlug' => $activeSlug,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user?->journalPreset) {
            return response()->json([
                'message' => 'Custom preset already exists.',
            ], 409);
        }

        $sections = $this->validateAndBuildSections($request);

        $preset = JournalPreset::create([
            'user_id' => $user?->id,
            'sections' => $sections,
        ]);

        $setActive = (bool) $request->boolean('set_active', false);
        if ($setActive) {
            $user?->update(['journal_template_slug' => JournalTemplateCatalog::CUSTOM_SLUG]);
        }

        $templates = JournalTemplateCatalog::templatesForUser($user?->refresh());
        $activeSlug = JournalTemplateCatalog::resolveActiveSlug(
            $user?->journal_template_slug,
            $templates
        );

        return response()->json([
            'customPreset' => JournalTemplateCatalog::customTemplateFromPreset($preset),
            'activePresetSlug' => $activeSlug,
        ], 201);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $preset = $user?->journalPreset;

        if (! $preset) {
            return response()->json([
                'message' => 'Custom preset not found.',
            ], 404);
        }

        $sections = $this->validateAndBuildSections($request);

        $preset->update([
            'sections' => $sections,
        ]);

        $setActive = (bool) $request->boolean('set_active', false);
        if ($setActive) {
            $user?->update(['journal_template_slug' => JournalTemplateCatalog::CUSTOM_SLUG]);
        }

        $templates = JournalTemplateCatalog::templatesForUser($user?->refresh());
        $activeSlug = JournalTemplateCatalog::resolveActiveSlug(
            $user?->journal_template_slug,
            $templates
        );

        return response()->json([
            'customPreset' => JournalTemplateCatalog::customTemplateFromPreset($preset->refresh()),
            'activePresetSlug' => $activeSlug,
        ]);
    }

    public function updateActive(Request $request)
    {
        $user = $request->user();
        $templates = JournalTemplateCatalog::templatesForUser($user);

        $validated = Validator::make($request->all(), [
            'template_slug' => ['required', 'string', Rule::in(array_keys($templates))],
        ])->validate();

        $user?->update([
            'journal_template_slug' => $validated['template_slug'],
        ]);

        $activeSlug = JournalTemplateCatalog::resolveActiveSlug(
            $user?->journal_template_slug,
            $templates
        );

        return response()->json([
            'activePresetSlug' => $activeSlug,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function validateAndBuildSections(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'sections' => ['required', 'array', 'min:1', 'max:5'],
            'sections.*.title_en' => ['required', 'string', 'max:80'],
            'sections.*.title_ja' => ['nullable', 'string', 'max:80'],
            'sections.*.key' => ['nullable', 'string', 'max:120'],
        ], [
            'sections.min' => 'セクションは1つ以上必要です。',
            'sections.max' => 'セクションは5つまで作成できます。',
        ]);

        $validator->after(function ($validator) use ($request) {
            $sections = $request->input('sections', []);

            foreach ($sections as $index => $section) {
                $titleEn = trim((string) ($section['title_en'] ?? ''));

                if ($titleEn === '') {
                    $validator->errors()->add(
                        "sections.$index.title_en",
                        '英語タイトルは必須です。'
                    );
                    continue;
                }

                if (preg_match('/[\x{3040}-\x{30FF}\x{4E00}-\x{9FFF}\x{FF65}-\x{FF9F}]/u', $titleEn)) {
                    $validator->errors()->add(
                        "sections.$index.title_en",
                        '英語タイトルは英語で入力してください。'
                    );
                }
            }
        });

        $validated = $validator->validate();

        $sections = collect($validated['sections'])
            ->values()
            ->map(function ($section, int $index) {
                $titleEn = trim((string) ($section['title_en'] ?? ''));
                $titleJa = trim((string) ($section['title_ja'] ?? ''));
                $key = trim((string) ($section['key'] ?? ''));

                if ($key === '') {
                    $key = Str::uuid()->toString();
                }

                return [
                    'key' => $key,
                    'title_en' => $titleEn,
                    'title_ja' => $titleJa !== '' ? $titleJa : null,
                    'order' => $index + 1,
                    'input_type' => 'textarea',
                ];
            })
            ->values()
            ->all();

        $keys = collect($sections)->pluck('key')->filter();

        if ($keys->count() !== $keys->unique()->count()) {
            throw ValidationException::withMessages([
                'sections' => 'セクションのキーが重複しています。',
            ]);
        }

        return $sections;
    }
}
