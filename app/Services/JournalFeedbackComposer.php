<?php

namespace App\Services;

class JournalFeedbackComposer
{
    public function __construct(
        private JournalFeedbackService $feedbackService,
    ) {
    }

    /**
     * @param array<int, array<string, mixed>> $sections
     * @return array{feedback: array<string, mixed>, feedbackStatus: string}
     */
    public function build(array $sections): array
    {
        $sectionsForLlm = collect($sections)
            ->map(function (array $section) {
                $text = trim((string) ($section['value'] ?? ''));

                // 0〜2文字は「中身なし」とみなす（ラベルは保持）
                if (mb_strlen($text) <= 2) {
                    $text = '';
                }

                return [
                    'key' => $section['key'] ?? '',
                    'title_en' => $section['title_en'] ?? null,
                    'title_ja' => $section['title_ja'] ?? null,
                    'value' => $text,
                ];
            })
            ->values()
            ->all();

        $hasAnyLongSection = collect($sections)->contains(function (array $section) {
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

            return [
                'feedback' => $feedback,
                'feedbackStatus' => 'skipped_short',
            ];
        }

        $feedback = array_merge(
            $feedback,
            $this->feedbackService->generate($sectionsForLlm),
        );

        return [
            'feedback' => $feedback,
            'feedbackStatus' => $feedback['english_text'] === null ? 'error' : 'ok',
        ];
    }
}
