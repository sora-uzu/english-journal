<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JournalFeedbackService
{
    /**
     * Generate feedback payload for a journal entry.
     *
     * @param array $sections
     * @return array<string, mixed>
     */
    public function generate(array $sections): array
    {
        try {
            $response = Http::withToken(config('services.openai.api_key'))
                ->post(config('services.openai.base_url') . '/chat/completions', [
                    'model' => config('services.openai.model'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $this->systemPrompt(),
                        ],
                        [
                            'role' => 'user',
                            'content' => $this->buildJournalText($sections),
                        ],
                    ],
                    'temperature' => 0.4,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenAI API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return $this->fallback();
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || $content === '') {
                Log::warning('OpenAI response missing content', ['response' => $response->json()]);

                return $this->fallback();
            }

            $json = json_decode($content, true);

            if (! is_array($json)) {
                Log::warning('OpenAI response is not valid JSON', ['content' => $content]);

                return $this->fallback();
            }

            return [
                'english_text' => $json['english_text'] ?? null,
                'feedback_overall' => $json['feedback_overall'] ?? null,
                'feedback_corrections_json' => $json['feedback_corrections'] ?? [],
                'key_phrase_en' => $json['key_phrase_en'] ?? null,
                'key_phrase_ja' => $json['key_phrase_ja'] ?? null,
                'key_phrase_reason_ja' => $json['key_phrase_reason_ja'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to generate journal feedback', [
                'message' => $e->getMessage(),
            ]);

            return $this->fallback();
        }
    }

    private function buildJournalText(array $sections): string
    {
        $lines = [];

        foreach ($sections as $section) {
            $labelEn = $section['labelEn'] ?? $section['name'] ?? 'Section';
            $labelJa = $section['labelJa'] ?? null;
            $text = $section['text'] ?? '';

            $label = $labelJa ? "{$labelEn} ({$labelJa})" : $labelEn;
            $lines[] = trim($label . ': ' . $text);
        }

        return trim(implode("\n", array_filter($lines)));
    }

    private function systemPrompt(): string
    {
        return <<<PROMPT
You are an English writing tutor for adult Japanese learners.
日本語と英語が混ざった短い日記を読み、以下のJSONフォーマットで必ず応答してください:

{
  "english_text": string,
  "feedback_overall": string,
  "feedback_corrections": [
    {
      "before": string,
      "after": string,
      "note_ja": string
    }
  ],
  "key_phrase_en": string,
  "key_phrase_ja": string,
  "key_phrase_reason_ja": string
}

- english_text: ユーザーの日記全体を自然な英語に書き直したもの
- feedback_overall: 全体的なコメント（優しく・短めに）
- feedback_corrections: 代表的な2〜3箇所だけ、before/afterと日本語での説明を入れる
- key_phrase_en: その日のキーフレーズとなる英語の1文
- key_phrase_ja: その日本語訳
- key_phrase_reason_ja: なぜそのフレーズを選んだかの説明（日本語）

必ず有効なJSONだけを返してください。余計な説明文は書かないでください。
PROMPT;
    }

    private function fallback(): array
    {
        return [
            'english_text' => null,
            'feedback_overall' => '英語フィードバックの生成に失敗しました。',
            'feedback_corrections_json' => [],
            'key_phrase_en' => null,
            'key_phrase_ja' => null,
            'key_phrase_reason_ja' => null,
        ];
    }
}
