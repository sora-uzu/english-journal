<?php

namespace Tests\Unit;

use App\Services\JournalFeedbackComposer;
use App\Services\JournalFeedbackService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class JournalFeedbackComposerTest extends TestCase
{
    public function test_skips_generation_for_short_sections(): void
    {
        Http::fake();

        $composer = new JournalFeedbackComposer(new JournalFeedbackService());
        $result = $composer->build([
            [
                'key' => 'free_writing',
                'title_en' => 'Free writing',
                'title_ja' => '自由に書く',
                'value' => 'ok',
            ],
        ]);

        $this->assertSame('skipped_short', $result['feedbackStatus']);
        $this->assertNull($result['feedback']['english_text']);
        Http::assertNothingSent();
    }
}
