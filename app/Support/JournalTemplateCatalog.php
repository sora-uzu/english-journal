<?php

namespace App\Support;

class JournalTemplateCatalog
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return array_values(self::templates());
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

    public static function defaultSlug(): string
    {
        return (string) config('journal_templates.default', 'simple');
    }
}
