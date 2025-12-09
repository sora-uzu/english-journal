import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

type JournalSectionName = 'Mood' | 'WhatIDid' | 'ThoughtsPlans';

interface Section {
    name: JournalSectionName;
    labelEn?: string;
    labelJa?: string;
    text: string;
}

interface Correction {
    before: string;
    after: string;
    note_ja: string;
}

interface FeedbackData {
    english_text: string | null;
    feedback_overall: string | null;
    feedback_corrections: Correction[];
    key_phrase_en: string | null;
    key_phrase_ja: string | null;
    key_phrase_reason_ja: string | null;
}

type FeedbackPageProps = PageProps<{
    entry: {
        id: number;
        date: string;
        sections: Section[];
        feedback: FeedbackData;
    };
}>;

export default function Feedback({ entry }: FeedbackPageProps) {
    const { date, feedback } = entry;
    const corrections = feedback.feedback_corrections ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="Feedback" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <div className="text-sm text-gray-500">{date}</div>

                    <section className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-2 text-lg font-semibold">
                            Your English journal
                        </h2>
                        {feedback.english_text ? (
                            <p className="whitespace-pre-line text-gray-800">
                                {feedback.english_text}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400">
                                まだ英語日記は生成されていません。
                            </p>
                        )}
                    </section>

                    <section className="space-y-4 rounded-lg bg-white p-6 shadow">
                        <h2 className="text-lg font-semibold">Feedback</h2>

                        {feedback.feedback_overall && (
                            <p className="text-gray-800">
                                {feedback.feedback_overall}
                            </p>
                        )}

                        {corrections.length > 0 && (
                            <div className="space-y-3">
                                {corrections.map((c, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-md border border-gray-200 p-3 text-sm"
                                    >
                                        <div>
                                            <span className="font-semibold text-gray-700">
                                                Before:{' '}
                                            </span>
                                            <span className="text-gray-700">
                                                {c.before}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">
                                                After:{' '}
                                            </span>
                                            <span className="text-gray-900">
                                                {c.after}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {c.note_ja}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!feedback.feedback_overall && corrections.length === 0 && (
                            <p className="text-sm text-gray-400">
                                まだフィードバックはありません。
                            </p>
                        )}
                    </section>

                    <section className="space-y-2 rounded-lg bg-white p-6 shadow">
                        <h2 className="text-lg font-semibold">
                            Today&apos;s key phrase
                        </h2>

                        {feedback.key_phrase_en ? (
                            <>
                                <p className="text-base font-medium text-indigo-700">
                                    {feedback.key_phrase_en}
                                </p>
                                {feedback.key_phrase_ja && (
                                    <p className="text-sm text-gray-700">
                                        {feedback.key_phrase_ja}
                                    </p>
                                )}
                                {feedback.key_phrase_reason_ja && (
                                    <p className="text-xs text-gray-500">
                                        {feedback.key_phrase_reason_ja}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                キーフレーズはまだ設定されていません。
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
