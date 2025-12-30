<?php

namespace App\Http\Controllers;

use App\Support\JournalTemplateCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class JournalSectionSettingsController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();
        $templates = JournalTemplateCatalog::templatesForUser($user);
        $currentTemplateSlug = JournalTemplateCatalog::resolveActiveSlug(
            $user?->journal_template_slug,
            $templates
        );

        return Inertia::render('Settings/Sections', [
            'templates' => array_values($templates),
            'currentTemplateSlug' => $currentTemplateSlug,
        ]);
    }

    public function update(Request $request)
    {
        $templates = JournalTemplateCatalog::templatesForUser($request->user());

        $validated = Validator::make($request->all(), [
            'template_slug' => ['required', 'string', Rule::in(array_keys($templates))],
        ])->validate();

        $request->user()?->update([
            'journal_template_slug' => $validated['template_slug'],
        ]);

        $templateName = $templates[$validated['template_slug']]['name'] ?? null;
        $message = $templateName
            ? 'プリセット「'.$templateName.'」を保存しました。'
            : 'プリセットを保存しました。';

        return Redirect::route('journal.create')->with('preset_saved_message', $message);
    }
}
