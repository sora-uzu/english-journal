<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JournalController extends Controller
{
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

        $journal = Journal::updateOrCreate(
            [
                'user_id' => $userId,
                'date'    => $validated['date'],
            ],
            [
                'sections_json' => $validated['sections'],

                // ここはあとで LLM のレスポンスに差し替える
                'english_text' => 'TODO: call LLM and store english_text',
                'feedback_overall' => 'TODO: feedback_overall',
                'feedback_corrections_json' => [],
                'key_phrase_en' => null,
                'key_phrase_ja' => null,
                'key_phrase_reason_ja' => null,
            ]
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
}
