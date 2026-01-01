<?php

namespace Tests\Unit;

use App\Models\JournalPreset;
use App\Models\User;
use App\Support\JournalTemplateCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JournalTemplateCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_templates_sorts_sections_by_order(): void
    {
        // セクションの順序がorderで整列されること
        config([
            'journal_templates.templates' => [
                'simple' => [
                    'slug' => 'simple',
                    'sections' => [
                        ['key' => 'second', 'order' => 2],
                        ['key' => 'first', 'order' => 1],
                    ],
                ],
            ],
        ]);

        $templates = JournalTemplateCatalog::templates();
        $sections = $templates['simple']['sections'];

        $this->assertSame(['first', 'second'], array_column($sections, 'key'));
    }

    public function test_templates_for_user_includes_custom_preset(): void
    {
        // ユーザーのカスタムプリセットが取り込まれること
        config([
            'journal_templates.templates' => [
                'simple' => [
                    'slug' => 'simple',
                    'sections' => [],
                ],
            ],
        ]);

        $user = User::factory()->create();
        JournalPreset::create([
            'user_id' => $user->id,
            'sections' => [
                ['key' => 'later', 'title_en' => 'Later', 'order' => 2],
                ['key' => 'first', 'title_en' => 'First', 'order' => 1],
            ],
        ]);

        $templates = JournalTemplateCatalog::templatesForUser($user);
        $custom = $templates[JournalTemplateCatalog::CUSTOM_SLUG] ?? null;

        $this->assertNotNull($custom);
        $this->assertSame('custom', $custom['slug']);
        $this->assertSame(['first', 'later'], array_column($custom['sections'], 'key'));
    }

    public function test_resolve_active_slug_prefers_valid_else_default(): void
    {
        // 指定slugが無効な場合はデフォルトにフォールバックすること
        config([
            'journal_templates.default' => 'simple',
        ]);

        $templates = [
            'simple' => ['slug' => 'simple'],
            'classic' => ['slug' => 'classic'],
        ];

        $this->assertSame('classic', JournalTemplateCatalog::resolveActiveSlug('classic', $templates));
        $this->assertSame('simple', JournalTemplateCatalog::resolveActiveSlug('missing', $templates));
    }
}
