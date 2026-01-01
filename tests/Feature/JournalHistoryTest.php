<?php

namespace Tests\Feature;

use App\Models\Journal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JournalHistoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sections(string $value): array
    {
        return [
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => $value,
            ],
        ];
    }

    private function createJournal(User $user, string $date, ?string $keyPhraseEn): Journal
    {
        $sections = $this->sections('Entry for '.$date);

        return Journal::create([
            'user_id' => $user->id,
            'date' => $date,
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => $keyPhraseEn,
            'key_phrase_ja' => $keyPhraseEn,
            'key_phrase_reason_ja' => null,
        ]);
    }

    public function test_history_returns_entries_for_selected_month(): void
    {
        // 指定月のエントリーのみ返ること
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createJournal($user, '2025-01-02', 'phrase a');
        $this->createJournal($user, '2025-01-10', 'phrase b');
        $this->createJournal($user, '2025-02-01', 'phrase c');
        $this->createJournal($otherUser, '2025-01-05', 'phrase x');

        $response = $this->actingAs($user)->get(route('journal.history', [
            'year' => 2025,
            'month' => 1,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('JournalHistory')
            ->where('year', 2025)
            ->where('month', 1)
            ->has('entries', 2)
            ->where('entries.0.date', '2025-01-02')
            ->where('entries.1.date', '2025-01-10')
        );
    }

    public function test_history_key_phrases_are_unique_and_limited(): void
    {
        // key phraseが重複排除され、最大3件になること
        $user = User::factory()->create();

        $this->createJournal($user, '2025-01-02', 'phrase a');
        $this->createJournal($user, '2025-01-04', 'phrase b');
        $this->createJournal($user, '2025-01-06', 'phrase a');
        $this->createJournal($user, '2025-01-08', 'phrase c');

        $response = $this->actingAs($user)->get(route('journal.history', [
            'year' => 2025,
            'month' => 1,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('JournalHistory')
            ->has('keyPhrases', 3)
            ->where('keyPhrases.0.key_phrase_en', 'phrase c')
            ->where('keyPhrases.1.key_phrase_en', 'phrase a')
            ->where('keyPhrases.2.key_phrase_en', 'phrase b')
        );
    }
}
