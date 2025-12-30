import AppLayout from "@/Layouts/AppLayout";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import GlassModal from "@/Components/ui/GlassModal";
import { PageProps } from "@/types";
import { downloadText, journalToMarkdown } from "@/lib/journalExport";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";

type FeedbackStatus = "ok" | "skipped_short" | "error";

interface Section {
    key: string;
    title_en?: string;
    title_ja?: string;
    value: string;
    order?: number;
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

const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseEnglishJournal = (
    englishText: string,
    sections: Section[]
): DisplaySection[] => {
    if (!englishText.trim() || sections.length === 0) {
        return [];
    }

    const labels = sections.map(
        (section) => section.title_en ?? section.title_ja ?? section.key
    );
    const sortedLabels = [...labels].sort((a, b) => b.length - a.length);
    const labelMap = new Map(
        labels.map((label) => [label.toLowerCase(), label])
    );
    const labelPattern = sortedLabels.map(escapeRegExp).join("|");

    if (!labelPattern) {
        return [];
    }

    const regex = new RegExp(`(${labelPattern})\\s*:\\s*`, "gi");
    const matches: Array<{ label: string; start: number; index: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(englishText)) !== null) {
        const matchedLabel = labelMap.get(match[1].toLowerCase());
        if (!matchedLabel) {
            continue;
        }
        matches.push({
            label: matchedLabel,
            start: match.index + match[0].length,
            index: match.index,
        });
    }

    if (matches.length === 0) {
        return [];
    }

    const textByLabel = new Map<string, string>();
    matches.forEach((current, idx) => {
        const next = matches[idx + 1];
        const end = next ? next.index : englishText.length;
        const text = englishText.slice(current.start, end).trim();
        textByLabel.set(current.label, text);
    });

    return sections
        .map((section) => {
            const label = section.title_en ?? section.title_ja ?? section.key;
            return {
                id: section.key,
                label,
                text: textByLabel.get(label) ?? "",
            };
        })
        .filter((section) => section.text.trim().length > 0);
};

const buildTtsText = (
    englishText: string | null | undefined,
    sections: DisplaySection[]
): string => {
    const parts = sections
        .map((section) => section.text.trim())
        .filter(Boolean);

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

const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === "undefined") {
        return false;
    }

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn("Clipboard write failed, falling back.", error);
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand("copy");
    textarea.remove();
    return success;
};

const FeedbackTip = ({ correction }: { correction: Correction }) => (
    <GlassCard className="rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
        <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                PHRASE
            </span>
        </div>
        <div className="space-y-1.5">
            <p className="rounded-xl bg-white/60 px-3 py-2 text-slate-700">
                <span className="mr-1 font-semibold text-slate-500">
                    Before:
                </span>
                {correction.before}
            </p>
            <p className="rounded-xl bg-violet-50/70 px-3 py-2 text-slate-900">
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
    </GlassCard>
);

type ExportModalProps = {
    open: boolean;
    onClose: () => void;
    onCopy: () => void;
    onDownload: () => void;
};

const ExportModal = ({
    open,
    onClose,
    onCopy,
    onDownload,
}: ExportModalProps) => {
    if (!open) {
        return null;
    }

    return (
        <GlassModal
            open={open}
            onClose={onClose}
            containerClassName="max-w-md"
            ariaLabelledby="export-title"
        >
            <div className="space-y-4">
                <div>
                    <h2
                        id="export-title"
                        className="text-sm font-semibold uppercase tracking-wide text-slate-900/85"
                    >
                        Export
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                        Notion向けMarkdownをコピーするか、ファイルでダウンロードできます。
                    </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <GlassButton
                        type="button"
                        className="w-full px-4 py-2.5 text-sm"
                        onClick={onCopy}
                    >
                        Copy to Notion
                    </GlassButton>
                    <GlassButton
                        type="button"
                        variant="secondary"
                        className="w-full px-4 py-2.5 text-sm"
                        onClick={onDownload}
                    >
                        Download .md
                    </GlassButton>
                </div>
                <div className="flex justify-end">
                    <GlassButton
                        type="button"
                        variant="ghost"
                        className="px-4 py-2 text-xs"
                        onClick={onClose}
                    >
                        Close
                    </GlassButton>
                </div>
            </div>
        </GlassModal>
    );
};

export default function Feedback({ entry }: FeedbackPageProps) {
    const { date, feedback, feedbackStatus } = entry;
    const corrections = feedback?.feedback_corrections ?? [];
    const hasEnglishFeedback =
        feedbackStatus === "ok" && Boolean(feedback && feedback.english_text);
    const hasKeyPhrase =
        feedbackStatus === "ok" && Boolean(feedback && feedback.key_phrase_en);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showAllTips, setShowAllTips] = useState(false);
    const sortedSections = [...entry.sections].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const englishText = feedback?.english_text ?? "";
    const englishJournalSections = parseEnglishJournal(
        englishText,
        sortedSections
    );
    const ttsText = buildTtsText(englishText, englishJournalSections);
    const hasParsedEnglishSections = englishJournalSections.length > 0;
    const [showExportModal, setShowExportModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!toastMessage) {
            return;
        }

        const timer = window.setTimeout(() => {
            setToastMessage(null);
        }, 2200);

        return () => window.clearTimeout(timer);
    }, [toastMessage]);

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

    const handleCopyToNotion = async () => {
        const markdown = journalToMarkdown(entry);
        const success = await copyTextToClipboard(markdown);
        setToastMessage(success ? "Copied" : "Copy failed");
    };

    const handleDownloadMarkdown = () => {
        const markdown = journalToMarkdown(entry);
        const filename = `journal-${date}.md`;
        downloadText(filename, markdown);
        setToastMessage("Downloaded");
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

    const originalJournalSections: DisplaySection[] = sortedSections
        .map((section) => ({
            id: section.key,
            label: section.title_en ?? section.title_ja ?? section.key,
            text: section.value,
        }))
        .filter((section) => section.text.trim().length > 0);

    const visibleCorrections = showAllTips
        ? corrections
        : corrections.slice(0, 2);
    const shouldShowToggle = corrections.length > 2;

    return (
        <AppLayout>
            <Head title="Feedback" />

            {toastMessage && (
                <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
                    <div className="rounded-full border border-emerald-200/70 bg-emerald-50/90 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.18)] backdrop-blur">
                        {toastMessage}
                    </div>
                </div>
            )}

            <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-500">{date}</p>
                    <GlassButton
                        type="button"
                        variant="secondary"
                        className="rounded-full px-3.5 py-1.5 text-xs"
                        onClick={() => setShowExportModal(true)}
                    >
                        <span
                            aria-hidden="true"
                            className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-[13px]"
                        >
                            📤
                        </span>
                        Export
                    </GlassButton>
                </div>

                <div className="mt-4 space-y-6 sm:space-y-8">
                    <GlassCard className="border-violet-200/60 bg-white/25 p-4 sm:p-5">
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">
                                Today&apos;s feedback
                            </p>
                            <p className="text-sm text-slate-800">
                                {summaryMessage}
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 sm:p-6">
                        <header className="mb-4">
                            <h2 className="text-base font-semibold text-slate-900">
                                Original Journal
                            </h2>
                        </header>

                        {originalJournalSections.length > 0 ? (
                            <div className="space-y-4">
                                {originalJournalSections.map((section) => {
                                    return (
                                        <div
                                            key={section.id}
                                            className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                {section.label}
                                            </p>
                                            <div className="mt-1 rounded-xl bg-white/40 px-3 py-2">
                                                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                                                    {section.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                まだ日記がありません。
                            </p>
                        )}
                    </GlassCard>

                    <GlassCard className="p-5 sm:p-6">
                        <header className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-slate-900">
                                Clean English
                            </h2>
                            <div className="flex items-center gap-2">
                                <GlassButton
                                    type="button"
                                    variant="secondary"
                                    className="gap-1.5 rounded-full px-3.5 py-1.5 text-xs"
                                    onClick={handleSpeakClick}
                                    disabled={!ttsText.trim()}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-[13px]"
                                    >
                                        🔊
                                    </span>
                                    <span>{isSpeaking ? "Stop" : "Listen"}</span>
                                </GlassButton>
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
                                                        <div className="mt-1 rounded-xl bg-white/40 px-3 py-2">
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
                                                        Clean English
                                                    </p>
                                                    <div className="mt-1 rounded-xl bg-white/40 px-3 py-2">
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
                                <p className="text-sm text-slate-500">
                                    まだ英語フィードバックはありません。
                                </p>
                            )}
                    </GlassCard>

                    <GlassCard className="p-5 sm:p-6">
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
                    </GlassCard>

                    <GlassCard className="overflow-hidden p-0">
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
                                        <div className="mt-3 rounded-xl bg-white/40 px-3 py-2">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                                Why it&apos;s useful
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-700">
                                                {feedback.key_phrase_reason_ja}
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
                    </GlassCard>
                </div>
            </div>
            <ExportModal
                open={showExportModal}
                onClose={() => setShowExportModal(false)}
                onCopy={handleCopyToNotion}
                onDownload={handleDownloadMarkdown}
            />
        </AppLayout>
    );
}
