<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuestJournalFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_journal_page(): void
    {
        $this->get(route('journal.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Journal'));
    }

    public function test_history_requires_login(): void
    {
        $this->get(route('journal.history'))
            ->assertRedirect(route('login'));
    }

    public function test_guest_feedback_endpoint_returns_feedback(): void
    {
        $payload = [
            'english_text' => 'Free writing: I wrote a note today.',
            'feedback_overall' => 'Nice and clear.',
            'feedback_corrections' => [],
            'key_phrase_en' => 'wrote a note',
            'key_phrase_ja' => 'メモを書いた',
            'key_phrase_reason_ja' => '覚えやすい表現です。',
        ];

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode($payload)]],
                ],
            ], 200),
        ]);

        $response = $this->postJson(route('api.guest.feedback'), [
            'date' => '2025-01-01',
            'template_slug' => 'simple',
            'sections_json' => [
                [
                    'key' => 'free_writing',
                    'title_en' => 'Free writing',
                    'title_ja' => '自由に書く',
                    'value' => 'I wrote a note.',
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('entry.feedback.english_text', $payload['english_text'])
            ->assertJsonPath('entry.feedbackStatus', 'ok');
    }
}
