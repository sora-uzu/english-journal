<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use App\Services\JournalFeedbackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
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

        return Inertia::render('Journal', [
            'today' => $today,
        ]);
    }

    /**
     * 日記保存
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => ['required', 'date'],
            'sections' => ['required', 'array', 'size:3'],
            'sections.*.name' => ['required', 'string'],
            'sections.*.labelEn' => ['required', 'string'],
            'sections.*.labelJa' => ['required', 'string'],
            'sections.*.text' => ['nullable', 'string', 'max:'.self::SECTION_TEXT_MAX],
        ], [
            'sections.*.text.max' => '各セクションは'.self::SECTION_TEXT_MAX.'文字以内で入力してください。',
        ]);

        $validator->after(function ($validator) {
            $sections = $validator->getData()['sections'] ?? [];
            $hasContent = collect($sections)->contains(function ($section) {
                return trim($section['text'] ?? '') !== '';
            });

            if (! $hasContent) {
                $validator->errors()->add('sections', '少なくとも1つのセクションに入力してください。');
            }
        });

        $validated = $validator->validate();

        $userId = Auth::id();
        $sections = $validated['sections'];

        $sectionsForLlm = collect($sections)
            ->map(function (array $section) {
                $text = trim((string) ($section['text'] ?? ''));

                // 0〜2文字は「中身なし」とみなし、LLM入力から除外
                if (mb_strlen($text) <= 2) {
                    return null;
                }

                return [
                    'name' => $section['name'],
                    'labelEn' => $section['labelEn'],
                    'labelJa' => $section['labelJa'],
                    'text' => $text,
                ];
            })
            ->filter()
            ->values()
            ->all();

        $feedback = [
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ];

        if (count($sectionsForLlm) === 0) {
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
                    'sections_json' => $sections, // 元の入力をそのまま保存
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

        $sections = $journal->sections_json ?? [];
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
            $text = trim((string) ($section['text'] ?? ''));

            if (mb_strlen($text) > 2) {
                return true;
            }
        }

        return false;
    }
}
