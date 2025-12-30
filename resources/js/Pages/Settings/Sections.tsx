import AppLayout from "@/Layouts/AppLayout";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { FormEvent } from "react";

interface TemplateSection {
    key: string;
    title_en: string;
    title_ja?: string;
    placeholder_en?: string;
    placeholder_ja?: string;
    order: number;
    input_type: "textarea";
}

interface Template {
    slug: string;
    name: string;
    description?: string;
    sections: TemplateSection[];
}

export default function Sections({
    templates,
    currentTemplateSlug,
}: PageProps<{ templates: Template[]; currentTemplateSlug: string }>) {
    const { data, setData, put, processing, errors } = useForm({
        template_slug: currentTemplateSlug,
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        put(route("settings.sections.update"));
    };

    return (
        <AppLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Sections
                </h2>
            }
        >
            <Head title="Sections" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <GlassCard className="p-6 sm:p-8">
                        <div className="space-y-2">
                            <h3 className="text-base font-semibold text-slate-900">
                                Choose your journal preset
                            </h3>
                            <p className="text-sm text-slate-600">
                                使い慣れた構成から始められます。プリセットは後からいつでも切り替えできます。
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {templates.map((template) => {
                                    const isSelected =
                                        data.template_slug === template.slug;
                                    const sortedSections = [
                                        ...template.sections,
                                    ].sort(
                                        (a, b) =>
                                            (a.order ?? 0) - (b.order ?? 0)
                                    );

                                    return (
                                        <label
                                            key={template.slug}
                                            className="group cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="template_slug"
                                                value={template.slug}
                                                checked={isSelected}
                                                onChange={() =>
                                                    setData(
                                                        "template_slug",
                                                        template.slug
                                                    )
                                                }
                                                className="sr-only"
                                            />
                                            <GlassCard
                                                className={`h-full p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_45px_rgba(15,23,42,0.2)] ${
                                                    isSelected
                                                        ? "border-violet-200/80 bg-white/70 ring-2 ring-violet-300/60"
                                                        : "border-white/60"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                aria-hidden="true"
                                                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                                                    isSelected
                                                                        ? "border-violet-400 bg-violet-100"
                                                                        : "border-slate-300"
                                                                }`}
                                                            >
                                                                {isSelected && (
                                                                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                                                                )}
                                                            </span>
                                                            <h4 className="text-sm font-semibold text-slate-900">
                                                                {template.name}
                                                            </h4>
                                                        </div>
                                                        {template.description && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-4 space-y-2">
                                                    {sortedSections.map((section) => (
                                                        <div
                                                            key={section.key}
                                                            className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2"
                                                        >
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {section.title_en}
                                                            </span>
                                                            {section.title_ja && (
                                                                <span className="text-[11px] text-slate-500">
                                                                    {section.title_ja}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 text-[11px] font-medium text-slate-500">
                                                    {sortedSections.length} sections
                                                </div>
                                            </GlassCard>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.template_slug && (
                                <p className="mt-3 text-xs text-rose-600">
                                    {errors.template_slug}
                                </p>
                            )}

                            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                                <GlassButton
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2.5"
                                >
                                    {processing ? "Saving..." : "Save preset"}
                                </GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
