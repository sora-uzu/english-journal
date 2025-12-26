import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useState } from "react";

type JournalSectionName = "Mood" | "WhatIDid" | "ThoughtsPlans";
type FeedbackStatus = "ok" | "skipped_short" | "error";
type EnglishJournalSections = {
    mood?: string;
    whatIDid?: string;
    thoughtsPlans?: string;
};

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

type DisplaySection = {
    id: string;
    label: string;
    text: string;
};

type FeedbackPageProps = PageProps<{
    entry: {
        id: number;
        date: string;
        sections: Section[];
        feedback: FeedbackData | null;
        feedbackStatus: FeedbackStatus;
    };
}>;

const parseEnglishJournal = (englishText: string): EnglishJournalSections => {
    const pattern =
        /^Mood:\s*([\s\S]*?)\s*What I did:\s*([\s\S]*?)\s*Thoughts & Plans:\s*([\s\S]*)$/;
    const match = englishText.match(pattern);

    if (!match) {
        return {};
    }

    const [, mood, whatIDid, thoughtsPlans] = match;

    return {
        mood: mood.trim() || undefined,
        whatIDid: whatIDid.trim() || undefined,
        thoughtsPlans: thoughtsPlans.trim() || undefined,
    };
};

const buildTtsText = (
    englishText: string | null | undefined,
    sections: EnglishJournalSections
): string => {
    const parts: string[] = [];
    if (sections.mood) parts.push(sections.mood);
    if (sections.whatIDid) parts.push(sections.whatIDid);
    if (sections.thoughtsPlans) parts.push(sections.thoughtsPlans);

    if (parts.length > 0) {
        return parts.join(" ");
    }

    return englishText ?? "";
};

const getFirstSentence = (text: string): string => {
    const trimmed = text.trim();
    if (!trimmed) {
        return "";
    }

    const match = trimmed.match(/[^.!?。！？]+[.!?。！？]?/);
    return match ? match[0].trim() : trimmed;
};

const FeedbackTip = ({ correction }: { correction: Correction }) => (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-800">
        <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                PHRASE
            </span>
        </div>
        <div className="space-y-1.5">
            <p className="rounded-xl bg-white px-3 py-2 text-slate-700">
                <span className="mr-1 font-semibold text-slate-500">
                    Before:
                </span>
                {correction.before}
            </p>
            <p className="rounded-xl bg-violet-50/80 px-3 py-2 text-slate-900">
                <span className="mr-1 font-semibold text-violet-700">
                    After:
                </span>
                {correction.after}
            </p>
        </div>
        {correction.note_ja && (
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {correction.note_ja}
            </p>
        )}
    </div>
);

export default function Feedback({ entry }: FeedbackPageProps) {
    const { date, feedback, feedbackStatus } = entry;
    const corrections = feedback?.feedback_corrections ?? [];
    const hasEnglishFeedback =
        feedbackStatus === "ok" && Boolean(feedback && feedback.english_text);
    const hasKeyPhrase =
        feedbackStatus === "ok" && Boolean(feedback && feedback.key_phrase_en);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showAllTips, setShowAllTips] = useState(false);
    const englishText = feedback?.english_text ?? "";
    const englishSections = parseEnglishJournal(englishText);
    const ttsText = buildTtsText(englishText, englishSections);
    const hasParsedEnglishSections =
        Boolean(englishSections.mood) ||
        Boolean(englishSections.whatIDid) ||
        Boolean(englishSections.thoughtsPlans);
    const handleSpeakClick = () => {
        if (typeof window === "undefined") {
            return;
        }

        const textToSpeak = ttsText.trim();
        if (!textToSpeak) {
            return;
        }

        if (!("speechSynthesis" in window)) {
            console.warn("SpeechSynthesis is not supported in this browser.");
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "en-US";
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const journalMessage =
        feedbackStatus === "skipped_short"
            ? "今回はとても短い日記だったので、英語フィードバックは生成していません。元の日記の内容だけを表示します。"
            : feedbackStatus === "error"
            ? "英語フィードバックの生成に失敗しました。通信状況や時間をおいて、もう一度お試しください。"
            : null;

    const summarySource =
        feedback?.feedback_overall ??
        journalMessage ??
        "まだフィードバックはありません。";
    const summaryMessage =
        feedbackStatus === "ok" && feedback?.feedback_overall
            ? getFirstSentence(summarySource)
            : summarySource;

    const englishJournalSections: DisplaySection[] = [
        {
            id: "mood",
            label: "Mood",
            text: englishSections.mood ?? "",
        },
        {
            id: "what-i-did",
            label: "What I did",
            text: englishSections.whatIDid ?? "",
        },
        {
            id: "thoughts-plans",
            label: "Thoughts & Plans",
            text: englishSections.thoughtsPlans ?? "",
        },
    ].filter((section) => section.text.trim().length > 0);

    const fallbackJournalSections: DisplaySection[] = entry.sections
        .map((section) => ({
            id: section.name,
            label: section.labelEn ?? section.labelJa ?? section.name,
            text: section.text,
        }))
        .filter((section) => section.text.trim().length > 0);

    const visibleCorrections = showAllTips
        ? corrections
        : corrections.slice(0, 2);
    const shouldShowToggle = corrections.length > 2;

    return (
        <AuthenticatedLayout>
            <Head title="Feedback" />

            <div className="bg-slate-50">
                <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                    <p className="text-xs font-medium text-slate-500">{date}</p>

                    <div className="mt-4 space-y-6 sm:space-y-8">
                        <section className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 shadow-sm sm:p-5">
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">
                                    Today&apos;s feedback
                                </p>
                                <p className="text-sm text-slate-800">
                                    {summaryMessage}
                                </p>
                            </div>
                        </section>

                        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                            <header className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Your English journal
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur transition hover:bg-indigo-50 active:scale-[0.97] active:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={handleSpeakClick}
                                        disabled={!ttsText.trim()}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[13px]"
                                        >
                                            🔊
                                        </span>
                                        <span>{isSpeaking ? "Stop" : "Listen"}</span>
                                    </button>
                                </div>
                            </header>

                            {journalMessage && (
                                <p className="mb-4 text-sm text-slate-600">
                                    {journalMessage}
                                </p>
                            )}

                            {hasEnglishFeedback ? (
                                <>
                                    {hasParsedEnglishSections ? (
                                        <div className="space-y-4">
                                            {englishJournalSections.map((section) => {
                                                return (
                                                    <div
                                                        key={section.id}
                                                        className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
                                                    >
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                            {section.label}
                                                        </p>
                                                        <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2">
                                                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">
                                                                {section.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        englishText && (
                                            <div className="space-y-4">
                                                <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                        Journal
                                                    </p>
                                                    <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2">
                                                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900">
                                                            {englishText}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {fallbackJournalSections.map((section) => {
                                        return (
                                            <div
                                                key={section.id}
                                                className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
                                            >
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                    {section.label}
                                                </p>
                                                <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2">
                                                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                                                        {section.text}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                            <header className="mb-3">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Feedback
                                </h2>
                                {feedbackStatus === "skipped_short" ? (
                                    <p className="mt-1 text-sm text-slate-700">
                                        今日はとても短い日記だったので、英語のフィードバックはつけていません。もう一文だけ増やしてもらえると、より具体的なフィードバックが返せます。
                                    </p>
                                ) : feedbackStatus === "error" ? (
                                    <p className="mt-1 text-sm text-slate-700">
                                        英語フィードバックの生成に失敗しました。通信状況や時間をおいて、もう一度お試しください。
                                    </p>
                                ) : null}
                            </header>

                            {feedbackStatus === "ok" && (
                                <>
                                    {corrections.length > 0 ? (
                                        <div className="space-y-3">
                                            {visibleCorrections.map(
                                                (correction, idx) => (
                                                    <FeedbackTip
                                                        key={`${correction.before}-${idx}`}
                                                        correction={correction}
                                                    />
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        !feedback?.feedback_overall && (
                                            <p className="text-sm text-slate-400">
                                                まだフィードバックはありません。
                                            </p>
                                        )
                                    )}

                                    {shouldShowToggle && (
                                        <button
                                            type="button"
                                            className="mt-3 rounded text-xs font-medium text-violet-600 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                                            onClick={() =>
                                                setShowAllTips((prev) => !prev)
                                            }
                                        >
                                            {showAllTips
                                                ? "Hide tips"
                                                : `Show all tips (${corrections.length})`}
                                        </button>
                                    )}
                                </>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />
                            <div className="p-5 sm:p-6">
                                <header className="mb-3 flex items-center justify-between gap-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Today&apos;s key phrase
                                    </h2>
                                </header>

                                {feedbackStatus === "skipped_short" ? (
                                    <p className="text-sm text-slate-600">
                                        今日は日記がとても短かったため、キーフレーズはありません。
                                    </p>
                                ) : feedbackStatus === "error" ? (
                                    <p className="text-sm text-slate-600">
                                        キーフレーズの生成に失敗しました。時間をおいて、もう一度お試しください。
                                    </p>
                                ) : hasKeyPhrase ? (
                                    <div>
                                        <p className="text-lg font-semibold leading-snug text-violet-700">
                                            {feedback?.key_phrase_en}
                                        </p>
                                        {feedback?.key_phrase_ja && (
                                            <p className="mt-1 text-sm text-slate-700">
                                                {feedback.key_phrase_ja}
                                            </p>
                                        )}
                                        {feedback?.key_phrase_reason_ja && (
                                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                    Why it&apos;s useful
                                                </p>
                                                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                                    {
                                                        feedback.key_phrase_reason_ja
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">
                                        今回はキーフレーズが生成されませんでした。次の日記でまたフレーズを確認してみましょう。
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
