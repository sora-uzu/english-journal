import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

type JournalSectionName = "Mood" | "WhatIDid" | "ThoughtsPlans";

interface Section {
    name: JournalSectionName;
    labelEn: string;
    labelJa: string;
    text: string;
}

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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Today&apos;s journal
                </h2>
            }
        >
            <Head title="Journal" />

            <div className="py-6">
                <div className="mx-auto max-w-xl sm:px-6 lg:px-8">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 rounded-lg bg-white p-6 shadow"
                    >
                        <p className="mb-2 text-sm text-gray-500">
                            {data.date}
                        </p>

                        {data.sections.map((section, index) => (
                            <div key={section.name} className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-semibold">
                                        {section.labelEn}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {section.labelJa}
                                    </span>
                                </div>
                                <textarea
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={section.text}
                                    onChange={(e) =>
                                        handleChangeSection(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder="英語でも日本語でも自由に書いてOKです。"
                                />
                            </div>
                        ))}

                        {errors.sections && (
                            <p className="text-sm text-red-500">
                                {String(errors.sections)}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {processing ? "Saving…" : "Get feedback"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
