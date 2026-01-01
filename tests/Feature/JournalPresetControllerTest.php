<?php

namespace Tests\Feature;

use App\Models\JournalPreset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JournalPresetControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<int, array<string, string>>
     */
    private function presetSections(array $overrides = []): array
    {
        return array_merge([
            [
                'title_en' => 'Morning',
                'title_ja' => '朝',
            ],
            [
                'title_en' => 'Evening',
                'title_ja' => '夜',
            ],
        ], $overrides);
    }

    public function test_index_returns_presets_and_active_slug(): void
    {
        // 一覧取得でプリセットとactive slugが返ること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson(route('api.presets.index'));

        $response->assertOk();
        $response->assertJsonPath('activePresetSlug', 'simple');
        $response->assertJsonPath('customPreset', null);
        $response->assertJsonCount(3, 'presets');
        $response->assertJsonFragment(['slug' => 'classic']);
        $response->assertJsonFragment(['slug' => 'simple']);
        $response->assertJsonFragment(['slug' => 'daily_log']);
    }

    public function test_store_creates_custom_preset_and_sets_active(): void
    {
        // カスタム作成とactive切替ができること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('api.presets.custom.store'), [
            'sections' => $this->presetSections(),
            'set_active' => true,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('customPreset.slug', 'custom');
        $response->assertJsonPath('activePresetSlug', 'custom');

        $this->assertDatabaseHas('journal_presets', [
            'user_id' => $user->id,
        ]);

        $this->assertSame('custom', $user->refresh()->journal_template_slug);
    }

    public function test_store_rejects_duplicate_section_keys(): void
    {
        // セクションキー重複はバリデーションエラーになること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('api.presets.custom.store'), [
            'sections' => [
                [
                    'title_en' => 'First',
                    'title_ja' => '一つ目',
                    'key' => 'dup',
                ],
                [
                    'title_en' => 'Second',
                    'title_ja' => '二つ目',
                    'key' => 'dup',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sections']);
        $this->assertDatabaseCount('journal_presets', 0);
    }

    public function test_store_rejects_japanese_title_en(): void
    {
        // title_enに日本語が含まれるとバリデーションエラーになること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('api.presets.custom.store'), [
            'sections' => [
                [
                    'title_en' => '朝のこと',
                    'title_ja' => '朝のこと',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sections.0.title_en']);
        $this->assertDatabaseCount('journal_presets', 0);
    }

    public function test_store_returns_conflict_when_custom_preset_exists(): void
    {
        // 既にカスタムがある場合は409になること
        $user = User::factory()->create();

        JournalPreset::create([
            'user_id' => $user->id,
            'sections' => $this->presetSections(),
        ]);

        $response = $this->actingAs($user)->postJson(route('api.presets.custom.store'), [
            'sections' => $this->presetSections(),
        ]);

        $response->assertStatus(409);
        $response->assertJsonPath('message', 'Custom preset already exists.');
        $this->assertDatabaseCount('journal_presets', 1);
    }

    public function test_update_returns_not_found_when_preset_missing(): void
    {
        // 未作成のカスタム更新は404になること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson(route('api.presets.custom.update'), [
            'sections' => $this->presetSections(),
        ]);

        $response->assertNotFound();
    }

    public function test_update_active_switches_template_slug(): void
    {
        // activeプリセットの切替が反映されること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson(route('api.presets.active.update'), [
            'template_slug' => 'classic',
        ]);

        $response->assertOk();
        $response->assertJsonPath('activePresetSlug', 'classic');
        $this->assertSame('classic', $user->refresh()->journal_template_slug);
    }

    public function test_update_custom_preset_overwrites_sections(): void
    {
        // カスタム更新でセクションが上書きされること
        $user = User::factory()->create();

        JournalPreset::create([
            'user_id' => $user->id,
            'sections' => $this->presetSections(),
        ]);

        $response = $this->actingAs($user)->putJson(route('api.presets.custom.update'), [
            'sections' => [
                [
                    'title_en' => 'Focus',
                    'title_ja' => '集中',
                ],
            ],
            'set_active' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('customPreset.sections.0.title_en', 'Focus');
        $response->assertJsonPath('activePresetSlug', 'custom');

        $this->assertDatabaseCount('journal_presets', 1);
        $this->assertSame('custom', $user->refresh()->journal_template_slug);
    }
}
