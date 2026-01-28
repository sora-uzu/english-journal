<?php

namespace Tests\Feature;

use App\Models\Journal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JournalControllerTest extends TestCase
{
    use RefreshDatabase;

    private function fakeOpenAiResponse(array $overrides = []): array
    {
        $payload = array_merge([
            'english_text' => 'Free writing: I felt good today.',
            'feedback_overall' => 'Simple and clear. Watch article usage.',
            'feedback_corrections' => [
                [
                    'before' => 'I go to store.',
                    'after' => 'I went to the store.',
                    'note_ja' => 'Use past tense for completed actions.',
                ],
            ],
            'key_phrase_en' => 'take a break',
            'key_phrase_ja' => 'take a break',
            'key_phrase_reason_ja' => 'Useful everyday phrase.',
        ], $overrides);

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode($payload)]],
                ],
            ], 200),
        ]);

        return $payload;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function simpleSections(string $value): array
    {
        return [
            ['key' => 'free_writing', 'value' => $value],
        ];
    }

    public function test_user_can_store_journal_entry_with_feedback(): void
    {
        // 正常に保存され、フィードバックが反映されること
        $user = User::factory()->create();
        $payload = $this->fakeOpenAiResponse();

        $response = $this->actingAs($user)->post(route('journal.store'), [
            'date' => '2025-01-01',
            'template_slug' => 'simple',
            'sections' => $this->simpleSections('I wrote a short entry.'),
        ]);

        $journal = Journal::first();
        $this->assertNotNull($journal);

        $response->assertRedirect(route('journal.show', $journal));

        $this->assertSame($user->id, $journal->user_id);
        $this->assertSame('2025-01-01', $journal->date);
        $this->assertSame('free_writing', $journal->sections[0]['key']);
        $this->assertSame('I wrote a short entry.', $journal->sections[0]['value']);
        $this->assertSame($payload['english_text'], $journal->english_text);
        $this->assertSame($payload['feedback_overall'], $journal->feedback_overall);
        $this->assertSame($payload['feedback_corrections'], $journal->feedback_corrections_json);
        $this->assertSame($payload['key_phrase_en'], $journal->key_phrase_en);
        $this->assertSame($payload['key_phrase_ja'], $journal->key_phrase_ja);
    }

    public function test_store_requires_at_least_one_non_empty_section(): void
    {
        // 空入力ではバリデーションエラーになること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('journal.store'), [
            'date' => '2025-01-02',
            'template_slug' => 'simple',
            'sections' => $this->simpleSections('   '),
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['sections']);
        $this->assertDatabaseCount('journals', 0);
    }

    public function test_store_rejects_sections_that_do_not_match_template(): void
    {
        // テンプレートと違うセクション構成は拒否されること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('journal.store'), [
            'date' => '2025-01-03',
            'template_slug' => 'simple',
            'sections' => [
                ['key' => 'mood', 'value' => 'Mismatch key'],
            ],
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['sections']);
        $this->assertDatabaseCount('journals', 0);
    }

    public function test_show_forbidden_for_other_users_journal(): void
    {
        // 他ユーザーの日記は閲覧できないこと
        $owner = User::factory()->create();
        $viewer = User::factory()->create();

        $sections = [
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => 'Hello',
            ],
        ];

        $journal = Journal::create([
            'user_id' => $owner->id,
            'date' => '2025-01-04',
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => 'Free writing: Hello.',
        ]);

        $this->actingAs($viewer)
            ->get(route('journal.show', $journal))
            ->assertForbidden();
    }

    public function test_show_marks_skipped_when_no_long_sections(): void
    {
        // 短文のみの場合は skipped_short 判定になること
        $user = User::factory()->create();

        $sections = [
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => 'ok',
            ],
        ];

        $journal = Journal::create([
            'user_id' => $user->id,
            'date' => '2025-01-05',
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ]);

        $this->actingAs($user)
            ->get(route('journal.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Feedback')
                ->where('entry.feedbackStatus', 'skipped_short')
                ->where('entry.id', $journal->id)
            );
    }

    public function test_show_marks_error_when_feedback_missing_for_long_entry(): void
    {
        // 長文があるのにフィードバックがない場合は error 判定になること
        $user = User::factory()->create();

        $sections = [
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => 'This is a longer entry.',
            ],
        ];

        $journal = Journal::create([
            'user_id' => $user->id,
            'date' => '2025-01-06',
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ]);

        $this->actingAs($user)
            ->get(route('journal.show', $journal))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Feedback')
                ->where('entry.feedbackStatus', 'error')
                ->where('entry.id', $journal->id)
            );
    }

    public function test_store_skips_feedback_for_short_sections(): void
    {
        // 短文のみの場合は生成をスキップすること
        Http::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('journal.store'), [
            'date' => '2025-01-07',
            'template_slug' => 'simple',
            'sections' => $this->simpleSections('ok'),
        ]);

        $journal = Journal::first();

        $response->assertRedirect(route('journal.show', $journal));
        $this->assertSame(
            '今回は日記の内容がとても短かったため、英語フィードバックは生成していません。',
            $journal->feedback_overall
        );
        $this->assertNull($journal->english_text);
        Http::assertNothingSent();
    }

    public function test_guest_store_is_idempotent(): void
    {
        $user = User::factory()->create();

        $payload = [
            'date' => '2025-01-09',
            'template_slug' => 'simple',
            'sections' => [
                ['key' => 'free_writing', 'value' => 'First entry'],
            ],
            'feedback' => [
                'english_text' => 'First English',
                'feedback_overall' => 'First summary',
                'feedback_corrections' => [],
                'key_phrase_en' => 'first phrase',
                'key_phrase_ja' => '初回',
                'key_phrase_reason_ja' => '最初の表現',
            ],
        ];

        $payloadUpdated = [
            'date' => '2025-01-09',
            'template_slug' => 'simple',
            'sections' => [
                ['key' => 'free_writing', 'value' => 'Second entry'],
            ],
            'feedback' => [
                'english_text' => 'Second English',
                'feedback_overall' => 'Second summary',
                'feedback_corrections' => [],
                'key_phrase_en' => 'second phrase',
                'key_phrase_ja' => '二回目',
                'key_phrase_reason_ja' => '更新された表現',
            ],
        ];

        $this->actingAs($user)
            ->postJson(route('journal.guest.store'), $payload)
            ->assertOk();

        $this->actingAs($user)
            ->postJson(route('journal.guest.store'), $payloadUpdated)
            ->assertOk();

        $this->assertDatabaseCount('journals', 1);

        $journal = Journal::first();
        $this->assertNotNull($journal);
        $this->assertSame('Second entry', $journal->sections[0]['value']);
        $this->assertSame('Second English', $journal->english_text);
        $this->assertSame('Second summary', $journal->feedback_overall);
        $this->assertSame('second phrase', $journal->key_phrase_en);
    }

    public function test_create_includes_today_journal_when_exists(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-10'));

        $user = User::factory()->create();
        $sections = [
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => 'Hello',
            ],
        ];

        $journal = Journal::create([
            'user_id' => $user->id,
            'date' => '2025-01-10',
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ]);

        $this->actingAs($user)
            ->get(route('journal.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journal')
                ->where('today', '2025-01-10')
                ->where('todayJournal.id', $journal->id)
                ->where('todayJournal.date', '2025-01-10')
                ->where('todayJournal.template_slug', 'simple')
                ->where('todayJournal.sections.0.key', 'free_writing')
            );

        Carbon::setTestNow();
    }

    public function test_create_returns_null_when_today_journal_missing(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-11'));

        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('journal.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journal')
                ->where('today', '2025-01-11')
                ->where('todayJournal', null)
            );

        Carbon::setTestNow();
    }

    public function test_create_returns_null_when_template_slug_cannot_be_resolved(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-12'));

        $user = User::factory()->create();
        $sections = [
            [
                'key' => 'unknown_key',
                'title_en' => 'Unknown',
                'title_ja' => null,
                'placeholder_en' => null,
                'placeholder_ja' => null,
                'order' => 1,
                'input_type' => 'textarea',
                'value' => 'Hello',
            ],
        ];

        Journal::create([
            'user_id' => $user->id,
            'date' => '2025-01-12',
            'sections' => $sections,
            'sections_json' => $sections,
            'english_text' => null,
            'feedback_overall' => null,
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ]);

        $this->actingAs($user)
            ->get(route('journal.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journal')
                ->where('today', '2025-01-12')
                ->where('todayJournal', null)
            );

        Carbon::setTestNow();
    }
}
