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
        feedback: FeedbackData | null;
    };
}>;

export default function Feedback({ entry }: FeedbackPageProps) {
    const { date, feedback } = entry;
    const corrections = feedback?.feedback_corrections ?? [];
    const hasEnglishFeedback = Boolean(feedback && feedback.english_text);
    const hasKeyPhrase = Boolean(feedback && feedback.key_phrase_en);

    return (
        <AuthenticatedLayout>
            <Head title="Feedback" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <div className="text-sm text-gray-500">{date}</div>

                    <section className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Your English journal
                        </h2>

                        {hasEnglishFeedback ? (
                            <p className="mt-3 whitespace-pre-line text-sm text-gray-800">
                                {feedback?.english_text}
                            </p>
                        ) : (
                            <div className="mt-3 space-y-3 text-sm text-gray-700">
                                <p className="text-gray-600">
                                    英語フィードバックの生成に失敗しました。元の日記の内容をそのまま表示します。
                                </p>
                                <ul className="space-y-1">
                                    {entry.sections.map((section) => (
                                        <li key={section.name}>
                                            <span className="font-medium text-gray-800">
                                                {section.labelJa}：
                                            </span>{' '}
                                            <span>{section.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Feedback
                        </h2>

                        {hasEnglishFeedback ? (
                            <>
                                {feedback?.feedback_overall && (
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

                                {!feedback?.feedback_overall &&
                                    corrections.length === 0 && (
                                        <p className="text-sm text-gray-400">
                                            まだフィードバックはありません。
                                        </p>
                                    )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-600">
                                英語フィードバックの生成に失敗しました。通信状況や時間をおいて、もう一度お試しください。
                            </p>
                        )}
                    </section>

                    <section className="space-y-2 rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Today&apos;s key phrase
                        </h2>

                        {hasKeyPhrase ? (
                            <div className="mt-2">
                                <p className="text-xl font-semibold text-indigo-600">
                                    {feedback?.key_phrase_en}
                                </p>
                                {feedback?.key_phrase_ja && (
                                    <p className="mt-1 text-sm text-gray-700">
                                        {feedback.key_phrase_ja}
                                    </p>
                                )}
                                {feedback?.key_phrase_reason_ja && (
                                    <p className="mt-3 text-xs text-gray-500">
                                        {feedback.key_phrase_reason_ja}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-gray-600">
                                今回はキーフレーズが生成されませんでした。次の日記でまたフレーズを確認してみましょう。
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
