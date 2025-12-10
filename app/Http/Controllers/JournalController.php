<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use App\Services\JournalFeedbackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class JournalController extends Controller
{
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
     * 日記保存（LLM はまだダミー）
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'sections' => ['required', 'array', 'size:3'],
            'sections.*.name' => ['required', 'string'],
            'sections.*.labelEn' => ['required', 'string'],
            'sections.*.labelJa' => ['required', 'string'],
            'sections.*.text' => ['nullable', 'string'],
        ]);

        $userId = Auth::id();
        $feedback = $this->feedbackService->generate($validated['sections']);

        $journal = Journal::updateOrCreate(
            [
                'user_id' => $userId,
                'date'    => $validated['date'],
            ],
            array_merge(
                [
                    'sections_json' => $validated['sections'],
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

        return Inertia::render('Feedback', [
            'entry' => [
                'id' => $journal->id,
                'date' => (string) $journal->date,
                'sections' => $journal->sections_json,
                'feedback' => [
                    'english_text' => $journal->english_text,
                    'feedback_overall' => $journal->feedback_overall,
                    'feedback_corrections' => $journal->feedback_corrections_json ?? [],
                    'key_phrase_en' => $journal->key_phrase_en,
                    'key_phrase_ja' => $journal->key_phrase_ja,
                    'key_phrase_reason_ja' => $journal->key_phrase_reason_ja,
                ],
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
}
