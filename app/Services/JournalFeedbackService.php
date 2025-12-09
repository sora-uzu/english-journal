<?php

namespace App\Services;

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
        return [
            'english_text' => $this->composeEnglishText($sections),
            'feedback_overall' => $this->dummyFeedbackOverall(),
            'feedback_corrections_json' => $this->dummyCorrections(),
            'key_phrase_en' => $this->dummyKeyPhraseEn(),
            'key_phrase_ja' => $this->dummyKeyPhraseJa(),
            'key_phrase_reason_ja' => $this->dummyKeyPhraseReasonJa(),
        ];
    }

    private function composeEnglishText(array $sections): ?string
    {
        $texts = array_filter(array_map(
            fn ($section) => $section['text'] ?? null,
            $sections
        ));

        if (empty($texts)) {
            return 'Dummy English text';
        }

        return 'Dummy English text: ' . implode(' ', $texts);
    }

    private function dummyFeedbackOverall(): string
    {
        return 'This is a dummy feedback.';
    }

    private function dummyCorrections(): array
    {
        return [];
    }

    private function dummyKeyPhraseEn(): ?string
    {
        return 'Dummy key phrase (en)';
    }

    private function dummyKeyPhraseJa(): ?string
    {
        return 'Dummy key phrase (ja)';
    }

    private function dummyKeyPhraseReasonJa(): ?string
    {
        return 'Reason for the dummy key phrase.';
    }
}
