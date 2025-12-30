<?php

namespace App\Support;

use App\Models\JournalPreset;
use App\Models\User;

class JournalTemplateCatalog
{
    public const CUSTOM_SLUG = 'custom';

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return array_values(self::templates());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function allForUser(?User $user): array
    {
        return array_values(self::templatesForUser($user));
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function templates(): array
    {
        $templates = config('journal_templates.templates', []);

        if (! is_array($templates)) {
            return [];
        }

        $normalized = [];

        foreach ($templates as $slug => $template) {
            if (! is_array($template)) {
                continue;
            }

            $templateSlug = $template['slug'] ?? $slug;
            $sections = $template['sections'] ?? [];

            if (is_array($sections)) {
                usort($sections, function ($a, $b) {
                    $orderA = is_array($a) ? ($a['order'] ?? 0) : 0;
                    $orderB = is_array($b) ? ($b['order'] ?? 0) : 0;

                    return $orderA <=> $orderB;
                });
            } else {
                $sections = [];
            }

            $template['slug'] = $templateSlug;
            $template['sections'] = array_values($sections);
            $normalized[$templateSlug] = $template;
        }

        return $normalized;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function templatesForUser(?User $user): array
    {
        $templates = self::templates();
        $customTemplate = self::customTemplateFromPreset($user?->journalPreset);

        if ($customTemplate) {
            $templates[self::CUSTOM_SLUG] = $customTemplate;
        }

        return $templates;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function customTemplateFromPreset(?JournalPreset $preset): ?array
    {
        if (! $preset) {
            return null;
        }

        $sections = $preset->sections ?? [];

        if (! is_array($sections)) {
            return null;
        }

        $sections = array_values(array_filter($sections, 'is_array'));

        usort($sections, function ($a, $b) {
            $orderA = is_array($a) ? ($a['order'] ?? 0) : 0;
            $orderB = is_array($b) ? ($b['order'] ?? 0) : 0;

            return $orderA <=> $orderB;
        });

        return [
            'slug' => self::CUSTOM_SLUG,
            'name' => 'Custom',
            'description' => 'Your own section layout',
            'sections' => array_values($sections),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(?string $slug): ?array
    {
        $templates = self::templates();

        if ($slug && isset($templates[$slug])) {
            return $templates[$slug];
        }

        $defaultSlug = self::defaultSlug();

        if ($defaultSlug && isset($templates[$defaultSlug])) {
            return $templates[$defaultSlug];
        }

        return $templates ? reset($templates) : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findForUser(?User $user, ?string $slug): ?array
    {
        $templates = self::templatesForUser($user);

        if ($slug && isset($templates[$slug])) {
            return $templates[$slug];
        }

        $defaultSlug = self::defaultSlug();

        if ($defaultSlug && isset($templates[$defaultSlug])) {
            return $templates[$defaultSlug];
        }

        return $templates ? reset($templates) : null;
    }

    /**
     * @param array<string, array<string, mixed>> $templates
     */
    public static function resolveActiveSlug(?string $slug, array $templates): string
    {
        if ($slug && isset($templates[$slug])) {
            return $slug;
        }

        $defaultSlug = self::defaultSlug();

        if ($defaultSlug && isset($templates[$defaultSlug])) {
            return $defaultSlug;
        }

        return $templates ? (string) array_key_first($templates) : self::defaultSlug();
    }

    public static function defaultSlug(): string
    {
        return (string) config('journal_templates.default', 'simple');
    }
}
