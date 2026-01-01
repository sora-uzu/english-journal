<?php

namespace Tests\Unit;

use App\Services\JournalFeedbackService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class JournalFeedbackServiceTest extends TestCase
{
    /**
     * @return array<int, array<string, string|null>>
     */
    private function sampleSections(): array
    {
        return [
            [
                'title_en' => 'How I feel',
                'title_ja' => null,
                'key' => 'mood',
                'value' => 'Fine',
            ],
            [
                'title_en' => null,
                'title_ja' => 'Label JA',
                'key' => 'note_ja',
                'value' => '',
            ],
            [
                'title_en' => null,
                'title_ja' => null,
                'key' => 'note',
                'value' => 'Done',
            ],
        ];
    }

    public function test_generate_returns_payload_on_successful_response(): void
    {
        // 成功時にレスポンスが期待通り変換されること
        $payload = [
            'english_text' => 'How I feel: I feel good.',
            'feedback_overall' => 'Nice and clear.',
            'feedback_corrections' => [
                [
                    'before' => 'I go to store.',
                    'after' => 'I went to the store.',
                    'note_ja' => 'Use past tense.',
                ],
            ],
            'key_phrase_en' => 'take a break',
            'key_phrase_ja' => '休憩を取る',
            'key_phrase_reason_ja' => 'Common daily phrase.',
        ];

        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode($payload)]],
                ],
            ], 200),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertSame($payload['english_text'], $result['english_text']);
        $this->assertSame($payload['feedback_overall'], $result['feedback_overall']);
        $this->assertSame($payload['feedback_corrections'], $result['feedback_corrections_json']);
        $this->assertSame($payload['key_phrase_en'], $result['key_phrase_en']);
        $this->assertSame($payload['key_phrase_ja'], $result['key_phrase_ja']);
        $this->assertSame($payload['key_phrase_reason_ja'], $result['key_phrase_reason_ja']);
    }

    public function test_generate_returns_fallback_when_response_is_not_successful(): void
    {
        // API失敗時はフォールバックになること
        Http::fake([
            '*' => Http::response(['error' => 'fail'], 500),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertNull($result['english_text']);
        $this->assertSame('英語フィードバックの生成に失敗しました。', $result['feedback_overall']);
        $this->assertSame([], $result['feedback_corrections_json']);
    }

    public function test_generate_returns_fallback_when_response_content_is_invalid_json(): void
    {
        // contentがJSONでない場合はフォールバックになること
        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'not-json']],
                ],
            ], 200),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertNull($result['english_text']);
        $this->assertSame('英語フィードバックの生成に失敗しました。', $result['feedback_overall']);
    }

    public function test_generate_returns_empty_corrections_when_missing(): void
    {
        // corrections未返却でも空配列で返ること
        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode([
                        'english_text' => 'Ok.',
                        'feedback_overall' => 'Nice.',
                        'key_phrase_en' => null,
                        'key_phrase_ja' => null,
                        'key_phrase_reason_ja' => null,
                    ])]],
                ],
            ], 200),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertSame([], $result['feedback_corrections_json']);
    }

    public function test_generate_returns_fallback_when_response_content_is_missing(): void
    {
        // contentが欠落している場合はフォールバックになること
        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => []],
                ],
            ], 200),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertNull($result['english_text']);
        $this->assertSame('英語フィードバックの生成に失敗しました。', $result['feedback_overall']);
    }

    public function test_generate_returns_fallback_when_response_content_is_empty(): void
    {
        // contentが空文字の場合はフォールバックになること
        Http::fake([
            '*' => Http::response([
                'choices' => [
                    ['message' => ['content' => '']],
                ],
            ], 200),
        ]);

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertNull($result['english_text']);
        $this->assertSame('英語フィードバックの生成に失敗しました。', $result['feedback_overall']);
    }

    public function test_generate_returns_fallback_on_http_exception(): void
    {
        // 例外発生時はフォールバックになること
        Http::fake(function () {
            throw new \RuntimeException('boom');
        });

        $service = new JournalFeedbackService();
        $result = $service->generate($this->sampleSections());

        $this->assertNull($result['english_text']);
        $this->assertSame('英語フィードバックの生成に失敗しました。', $result['feedback_overall']);
    }

    public function test_generate_builds_prompt_with_label_fallbacks(): void
    {
        // ラベルの優先順と空セクションの扱いが反映されること
        $captured = null;

        Http::fake(function ($request) use (&$captured) {
            $captured = $request->data();

            return Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode([
                        'english_text' => null,
                        'feedback_overall' => null,
                        'feedback_corrections' => [],
                        'key_phrase_en' => null,
                        'key_phrase_ja' => null,
                        'key_phrase_reason_ja' => null,
                    ])]],
                ],
            ], 200);
        });

        $service = new JournalFeedbackService();
        $service->generate($this->sampleSections());

        $this->assertNotNull($captured);
        $this->assertSame(
            "How I feel: Fine\nLabel JA:\nnote: Done",
            $captured['messages'][1]['content']
        );
    }
}
