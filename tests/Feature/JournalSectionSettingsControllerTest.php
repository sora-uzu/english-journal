<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JournalSectionSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_edit_displays_templates_and_current_slug(): void
    {
        // 編集画面でテンプレート一覧と現在のslugが表示されること
        $user = User::factory()->create([
            'journal_template_slug' => 'daily_log',
        ]);

        $response = $this->actingAs($user)->get(route('settings.sections.edit'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Sections')
            ->where('currentTemplateSlug', 'daily_log')
            ->has('templates', 3)
        );
    }

    public function test_update_changes_template_slug_and_sets_message(): void
    {
        // 有効なslugで更新でき、メッセージが付与されること
        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('settings.sections.update'), [
            'template_slug' => 'classic',
        ]);

        $response->assertRedirect(route('journal.create'));
        $response->assertSessionHas('preset_saved_message', 'プリセット「Classic」を保存しました。');
        $this->assertSame('classic', $user->refresh()->journal_template_slug);
    }

    public function test_update_rejects_invalid_template_slug(): void
    {
        // 無効なslugはバリデーションエラーになること
        $user = User::factory()->create([
            'journal_template_slug' => 'daily_log',
        ]);

        $response = $this->actingAs($user)->put(route('settings.sections.update'), [
            'template_slug' => 'invalid',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['template_slug']);
        $this->assertSame('daily_log', $user->refresh()->journal_template_slug);
    }
}
