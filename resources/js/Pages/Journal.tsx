import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import AppLayout from "@/Layouts/AppLayout";
import JournalTextarea from "@/Components/JournalTextarea";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import GlassModal from "@/Components/ui/GlassModal";

type JournalSectionName = "Mood" | "WhatIDid" | "ThoughtsPlans";

interface Section {
    name: JournalSectionName;
    labelEn: string;
    labelJa: string;
    text: string;
}

const placeholders: Record<JournalSectionName, string> = {
    Mood: "例）I'm a bit tiredだけど、気分はpretty good。",
    WhatIDid: "例）午前はミーティングして、午後はカフェでreading time。",
    ThoughtsPlans: "例）明日はgymに行って、そのあと友だちとdinnerに行く予定。",
};

export default function Journal({ today }: PageProps<{ today: string }>) {
    const initialSections: Section[] = [
        {
            name: "Mood",
            labelEn: "Mood",
            labelJa: "気分",
            text: "",
        },
        {
            name: "WhatIDid",
            labelEn: "What I did",
            labelJa: "今日やったこと",
            text: "",
        },
        {
            name: "ThoughtsPlans",
            labelEn: "Thoughts & Plans",
            labelJa: "考えごと・明日やりたいこと",
            text: "",
        },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        date: string;
        sections: Section[];
    }>({
        date: today,
        sections: initialSections,
    });
    const [showGuide, setShowGuide] = React.useState(false);

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
                i === index ? { ...s, text: value } : s
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
                                    variant="ghost"
                                    onClick={openGuide}
                                    className="h-8 w-8 rounded-full p-0 text-xs font-semibold text-slate-600"
                                    aria-label="How to use this journal"
                                >
                                    ?
                                </GlassButton>
                            </div>
                            <p className="mb-3 text-xs text-slate-500 sm:text-sm sm:mb-2">
                                {data.date}
                            </p>

                            {data.sections.map((section, index) => {
                                const errorKey = `sections.${index}.text` as const;
                                const errorMessage = errors[errorKey];
                                const fieldId = `section-${section.name}-${index}`;

                                return (
                                    <JournalTextarea
                                        key={section.name}
                                        label={section.labelEn}
                                        subLabel={section.labelJa}
                                        name={fieldId}
                                        value={section.text}
                                        onChange={(value) =>
                                            handleChangeSection(index, value)
                                        }
                                        placeholder={
                                            placeholders[section.name] ??
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
                                        Generating your English feedback… this may
                                        take a few seconds.
                                    </p>
                                )}
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
            <GlassModal open={showGuide} onClose={handleCloseGuide}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-900/85">
                    HOW TO USE THIS JOURNAL
                </h2>
                <ul className="space-y-2 text-sm leading-relaxed text-slate-900/75">
                    <li>・日本語でも英語でも、どちらで書いてもOKです。</li>
                    <li>
                        ・1日1つ、3分くらいで「今日の気分」や「やったこと」を自由に書いてください。
                    </li>
                    <li>
                        ・Get feedback を押すと、自然な英語の文章と、その日のキーフレーズが返ってきます。
                    </li>
                </ul>

                <GlassButton
                    type="button"
                    className="mt-5 w-full py-2.5"
                    onClick={handleCloseGuide}
                >
                    Got it
                </GlassButton>
            </GlassModal>
        </AppLayout>
    );
}
