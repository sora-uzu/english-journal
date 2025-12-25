import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import JournalTextarea from "@/Components/JournalTextarea";

type JournalSectionName = "Mood" | "WhatIDid" | "ThoughtsPlans";

interface Section {
    name: JournalSectionName;
    labelEn: string;
    labelJa: string;
    text: string;
}

const placeholders: Record<JournalSectionName, string> = {
    Mood: "例）今日は少し疲れているけど、悪くない。",
    WhatIDid: "例）午前は仕事をして、午後はカフェで本を読んだ。",
    ThoughtsPlans: "例）明日はジムに行って、そのあと友だちとご飯に行く。",
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
        <AuthenticatedLayout>
            <Head title="Journal" />

            <div className="pt-2 pb-4 sm:py-5 md:py-6">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 sm:space-y-6 rounded-lg bg-white p-5 sm:p-6 shadow"
                    >
                        <p className="sm:hidden text-base font-semibold text-gray-900">
                            Today&apos;s journal
                        </p>
                        <p className="mt-1 mb-3 text-xs text-gray-500 sm:text-sm sm:mb-2">
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
                            <p className="text-sm text-red-500">
                                {String(errors.sections)}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-indigo-700 disabled:hover:bg-indigo-600"
                            >
                                {processing
                                    ? "Saving & generating feedback..."
                                    : "Get feedback"}
                            </button>
                            {processing && (
                                <p className="ml-3 text-xs text-gray-500">
                                    Generating your English feedback… this may
                                    take a few seconds.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Changes:
// - resources/js/Components/JournalTextarea.tsx: reusable, mobile-friendly textarea with auto-resize and compact default height.
// - resources/js/Layouts/AuthenticatedLayout.tsx: slightly slimmer mobile header height and title size while keeping desktop the same.
// - resources/js/Pages/Journal.tsx: moved mobile heading into the card, tightened mobile spacing/padding, shortened placeholders, and tweaked card heading/date hierarchy.
