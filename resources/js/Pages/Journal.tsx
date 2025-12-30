import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import AppLayout from "@/Layouts/AppLayout";
import JournalTextarea from "@/Components/JournalTextarea";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import HowToGuideModal from "@/Components/HowToGuideModal";

type JournalTemplateSection = {
    key: string;
    title_en: string;
    title_ja?: string;
    placeholder_en?: string;
    placeholder_ja?: string;
    order: number;
    input_type: "textarea";
};

type JournalTemplate = {
    slug: string;
    name: string;
    description?: string;
    sections: JournalTemplateSection[];
};

type Section = JournalTemplateSection & {
    value: string;
};

export default function Journal({
    today,
    template,
    presetSavedMessage,
}: PageProps<{
    today: string;
    template?: JournalTemplate;
    presetSavedMessage?: string | null;
}>) {
    const resolvedTemplate: JournalTemplate = template ?? {
        slug: "simple",
        name: "Simple",
        sections: [],
    };
    const initialSections: Section[] = [...resolvedTemplate.sections]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((section) => ({
            ...section,
            value: "",
        }));

    const { data, setData, post, processing, errors } = useForm<{
        date: string;
        template_slug: string;
        sections: Section[];
    }>({
        date: today,
        template_slug: resolvedTemplate.slug,
        sections: initialSections,
    });
    const [showGuide, setShowGuide] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(
        presetSavedMessage ?? null
    );

    React.useEffect(() => {
        if (!toastMessage) {
            return;
        }

        const timer = window.setTimeout(() => {
            setToastMessage(null);
        }, 2400);

        return () => window.clearTimeout(timer);
    }, [toastMessage]);

    React.useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const hasSeen = window.localStorage.getItem(
            "english-journal:hasSeenGuide"
        );
        if (!hasSeen) {
            setShowGuide(true);
        }
    }, []);

    const openGuide = () => {
        setShowGuide(true);
    };

    const handleCloseGuide = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("english-journal:hasSeenGuide", "true");
        }
        setShowGuide(false);
    };

    const handleChangeSection = (index: number, value: string) => {
        setData(
            "sections",
            data.sections.map((s, i) =>
                i === index ? { ...s, value } : s
            )
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("journal.store"));
    };

    return (
        <AppLayout>
            <Head title="Journal" />

            {toastMessage && (
                <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
                    <div className="rounded-full border border-emerald-200/70 bg-emerald-50/90 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.18)] backdrop-blur">
                        {toastMessage}
                    </div>
                </div>
            )}

            <div className="pt-2 pb-4 sm:py-5 md:py-6">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    <GlassCard className="p-5 sm:p-6">
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 sm:space-y-6"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
                                    Today&apos;s journal
                                </h1>
                                <GlassButton
                                    type="button"
                                    variant="secondary"
                                    onClick={openGuide}
                                    className="h-9 w-9 p-0 text-sm text-slate-900"
                                    aria-label="How to use this journal"
                                >
                                    ?
                                </GlassButton>
                            </div>
                            <p className="mb-3 text-xs text-slate-500 sm:text-sm sm:mb-2">
                                {data.date}
                            </p>

                            {data.sections.map((section, index) => {
                                const errorKey = `sections.${index}.value` as const;
                                const errorMessage = errors[errorKey];
                                const fieldId = `section-${section.key}-${index}`;

                                return (
                                    <JournalTextarea
                                        key={section.key}
                                        label={section.title_en}
                                        subLabel={section.title_ja}
                                        name={fieldId}
                                        value={section.value}
                                        onChange={(value) =>
                                            handleChangeSection(index, value)
                                        }
                                        placeholder={
                                            section.placeholder_ja ??
                                            section.placeholder_en ??
                                            "英語でも日本語でも自由に書いてOKです。"
                                        }
                                        error={errorMessage}
                                        disabled={processing}
                                    />
                                );
                            })}

                            {errors.sections && (
                                <p className="text-sm text-rose-500">
                                    {String(errors.sections)}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <GlassButton
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2.5"
                                >
                                    {processing
                                        ? "Saving & generating feedback..."
                                        : "Get feedback"}
                                </GlassButton>
                                {processing && (
                                    <p className="text-xs text-slate-500">
                                        英語フィードバックを生成しています。少しお待ちください。
                                    </p>
                                )}
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
            <HowToGuideModal open={showGuide} onClose={handleCloseGuide} />
        </AppLayout>
    );
}
