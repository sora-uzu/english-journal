<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use App\Services\JournalFeedbackService;
use App\Support\JournalTemplateCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class JournalController extends Controller
{
    private const SECTION_TEXT_MAX = 500;

    public function __construct(
        private JournalFeedbackService $feedbackService,
    ) {
    }

    /**
     * 日記入力画面
     */
    public function create()
    {
        $today = now()->toDateString();
        $templateSlug = Auth::user()?->journal_template_slug ?? JournalTemplateCatalog::defaultSlug();
        $template = JournalTemplateCatalog::find($templateSlug) ?? [
            'slug' => $templateSlug,
            'name' => 'Custom',
            'sections' => [],
        ];
        $presetSavedMessage = session('preset_saved_message');

        return Inertia::render('Journal', [
            'today' => $today,
            'template' => $template,
            'presetSavedMessage' => $presetSavedMessage,
        ]);
    }

    /**
     * 日記保存
     */
    public function store(Request $request)
    {
        $templateSlug = (string) $request->input(
            'template_slug',
            Auth::user()?->journal_template_slug ?? JournalTemplateCatalog::defaultSlug()
        );
        $templates = JournalTemplateCatalog::templates();
        $template = $templates[$templateSlug] ?? null;

        $validator = Validator::make($request->all(), [
            'date' => ['required', 'date'],
            'template_slug' => ['required', 'string', Rule::in(array_keys($templates))],
            'sections' => ['required', 'array'],
            'sections.*.key' => ['required', 'string'],
            'sections.*.value' => ['nullable', 'string', 'max:'.self::SECTION_TEXT_MAX],
        ], [
            'sections.*.value.max' => '各セクションは'.self::SECTION_TEXT_MAX.'文字以内で入力してください。',
        ]);

        $validator->after(function ($validator) use ($template) {
            if (! $template) {
                $validator->errors()->add('template_slug', 'セクションテンプレートの選択が正しくありません。');
                return;
            }

            $sections = $validator->getData()['sections'] ?? [];
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
                $validator->errors()->add('sections', 'セクション構成がテンプレートと一致しません。');
            }

            $hasContent = collect($sections)->contains(function ($section) {
                return trim($section['value'] ?? '') !== '';
            });

            if (! $hasContent) {
                $validator->errors()->add('sections', '少なくとも1つのセクションに入力してください。');
            }
        });

        $validated = $validator->validate();

        $userId = Auth::id();
        $sections = collect($template['sections'] ?? []);
        $valuesByKey = collect($validated['sections'] ?? [])
            ->mapWithKeys(fn ($section) => [$section['key'] => $section['value'] ?? '']);

        $sectionsToStore = $sections
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

        $sectionsForLlm = collect($sectionsToStore)
            ->map(function (array $section) {
                $text = trim((string) ($section['value'] ?? ''));

                // 0〜2文字は「中身なし」とみなす（ラベルは保持）
                if (mb_strlen($text) <= 2) {
                    $text = '';
                }

                return [
                    'key' => $section['key'],
                    'title_en' => $section['title_en'],
                    'title_ja' => $section['title_ja'],
                    'value' => $text,
                ];
            })
            ->values()
            ->all();

        $hasAnyLongSection = collect($sectionsToStore)->contains(function (array $section) {
            return mb_strlen(trim((string) ($section['value'] ?? ''))) > 2;
        });

        $feedback = [
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ];

        if (! $hasAnyLongSection) {
            $feedback['feedback_overall'] = '今回は日記の内容がとても短かったため、英語フィードバックは生成していません。';
        } else {
            $feedback = array_merge(
                $feedback,
                $this->feedbackService->generate($sectionsForLlm),
            );
        }

        $journal = Journal::updateOrCreate(
            [
                'user_id' => $userId,
                'date'    => $validated['date'],
            ],
            array_merge(
                [
                    'sections' => $sectionsToStore, // 元の入力をそのまま保存
                    'sections_json' => $sectionsToStore, // 互換用
                ],
                $feedback
            )
        );

        return redirect()->route('journal.show', $journal);
    }

    /**
     * 保存済み日記のフィードバック表示
     */
    public function show(Journal $journal)
    {
        if ($journal->user_id !== Auth::id()) {
            abort(403);
        }

        $sections = $this->normalizeSections($journal->sections ?? $journal->sections_json ?? []);
        $hasAnyLongSection = $this->hasAnyLongSection($sections);

        $feedbackStatus = 'ok'; // ok | skipped_short | error

        if (! $hasAnyLongSection && $journal->english_text === null) {
            $feedbackStatus = 'skipped_short';
        } elseif ($hasAnyLongSection && $journal->english_text === null) {
            $feedbackStatus = 'error';
        }

        return Inertia::render('Feedback', [
            'entry' => [
                'id' => $journal->id,
                'date' => (string) $journal->date,
                'sections' => $sections,
                'feedback' => [
                    'english_text' => $journal->english_text,
                    'feedback_overall' => $journal->feedback_overall,
                    'feedback_corrections' => $journal->feedback_corrections_json ?? [],
                    'key_phrase_en' => $journal->key_phrase_en,
                    'key_phrase_ja' => $journal->key_phrase_ja,
                    'key_phrase_reason_ja' => $journal->key_phrase_reason_ja,
                ],
                'feedbackStatus' => $feedbackStatus,
            ],
        ]);
    }

    /**
     * 過去の日記一覧（カレンダー表示）
     */
    public function history(Request $request)
    {
        $today = now();
        $year = (int) $request->query('year', $today->year);
        $month = (int) $request->query('month', $today->month);

        if ($month < 1 || $month > 12) {
            $month = $today->month;
        }

        if ($year < 1) {
            $year = $today->year;
        }

        $currentMonth = Carbon::create($year, $month, 1);
        $startOfMonth = $currentMonth->copy()->startOfMonth();
        $endOfMonth = $currentMonth->copy()->endOfMonth();

        $journals = Journal::where('user_id', Auth::id())
            ->whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->orderBy('date')
            ->get();

        $entries = $journals
            ->map(fn (Journal $journal) => [
                'id' => $journal->id,
                'date' => Carbon::parse($journal->date)->toDateString(),
                'hasEntry' => true,
                'key_phrase_en' => $journal->key_phrase_en,
                'key_phrase_ja' => $journal->key_phrase_ja,
            ])
            ->values();

        $keyPhrases = $journals
            ->filter(fn (Journal $journal) => $journal->key_phrase_en !== null)
            ->sortByDesc('date')
            ->unique('key_phrase_en')
            ->take(3)
            ->values()
            ->map(fn (Journal $journal) => [
                'id' => $journal->id,
                'date' => Carbon::parse($journal->date)->toDateString(),
                'key_phrase_en' => $journal->key_phrase_en,
                'key_phrase_ja' => $journal->key_phrase_ja,
            ]);

        return Inertia::render('JournalHistory', [
            'year' => $currentMonth->year,
            'month' => $currentMonth->month,
            'entries' => $entries,
            'keyPhrases' => $keyPhrases,
        ]);
    }

    /**
     * セクションの中に「3文字以上」の内容が1つでもあるかどうか判定する
     */
    private function hasAnyLongSection(array $sections): bool
    {
        foreach ($sections as $section) {
            $text = trim((string) ($section['value'] ?? $section['text'] ?? ''));

            if (mb_strlen($text) > 2) {
                return true;
            }
        }

        return false;
    }

    private function normalizeSections(array $sections): array
    {
        if ($sections === []) {
            return [];
        }

        if ($this->isNormalizedSections($sections)) {
            return collect($sections)
                ->sortBy('order')
                ->values()
                ->all();
        }

        return collect($sections)
            ->map(function (array $section, int $index) {
                $name = (string) ($section['name'] ?? 'section');

                return [
                    'key' => Str::snake($name),
                    'title_en' => $section['labelEn'] ?? $name,
                    'title_ja' => $section['labelJa'] ?? null,
                    'placeholder_en' => null,
                    'placeholder_ja' => null,
                    'order' => $index + 1,
                    'input_type' => 'textarea',
                    'value' => (string) ($section['text'] ?? ''),
                ];
            })
            ->values()
            ->all();
    }

    private function isNormalizedSections(array $sections): bool
    {
        $first = $sections[0] ?? null;

        if (! is_array($first)) {
            return false;
        }

        return array_key_exists('key', $first) && array_key_exists('value', $first);
    }
}
