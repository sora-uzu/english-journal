import React from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { PageProps } from "@/types";
import AppLayout from "@/Layouts/AppLayout";
import JournalTextarea from "@/Components/JournalTextarea";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import HowToGuideModal from "@/Components/HowToGuideModal";
import {
    JournalTemplate,
    JournalSectionInputType,
    JournalTemplateSection,
    consumeGuestPresetMessage,
    loadGuestActiveTemplateSlug,
    loadGuestCustomTemplate,
} from "@/lib/journalTemplates";
import {
    clearJournalDraft,
    loadJournalDraft,
    saveJournalDraft,
} from "@/lib/journalDraftStorage";
import {
    GuestPendingSave,
    clearGuestPendingSave,
    loadGuestPendingSave,
    saveGuestFeedbackEntry,
    saveGuestPendingSave,
} from "@/lib/guestFeedbackStorage";

type Section = JournalTemplateSection & {
    value: string;
};

type TodayJournal = {
    id: number;
    date: string;
    template_slug: string | null;
    sections: Section[];
};

const resolveInputType = (section: {
    input_type?: JournalSectionInputType;
    inputType?: JournalSectionInputType;
}) => section.input_type ?? section.inputType ?? "textarea";

export default function Journal({
    today,
    template,
    templates,
    currentTemplateSlug,
    presetSavedMessage,
    todayJournal,
}: PageProps<{
    today: string;
    todayJournal?: TodayJournal | null;
    template?: JournalTemplate;
    templates?: JournalTemplate[];
    currentTemplateSlug?: string;
    presetSavedMessage?: string | null;
}>) {
    const { props } = usePage<PageProps>();
    const isGuest = !props.auth.user;
    const guestCustomTemplate = isGuest ? loadGuestCustomTemplate() : null;
    const storedSlug = isGuest ? loadGuestActiveTemplateSlug() : null;

    const availableTemplates = React.useMemo(() => {
        const baseTemplates = templates ?? (template ? [template] : []);
        if (!guestCustomTemplate) {
            return baseTemplates;
        }

        return [
            ...baseTemplates.filter(
                (item) => item.slug !== guestCustomTemplate.slug
            ),
            guestCustomTemplate,
        ];
    }, [templates, template, guestCustomTemplate]);

    const activeSlug =
        storedSlug ?? currentTemplateSlug ?? template?.slug ?? "simple";
    const resolvedTemplate = React.useMemo(() => {
        const match = availableTemplates.find(
            (candidate) => candidate.slug === activeSlug
        );
        return (
            match ??
            template ?? {
                slug: "simple",
                name: "Simple",
                sections: [],
            }
        );
    }, [activeSlug, availableTemplates, template]);

    const hasTodayJournal = Boolean(todayJournal);

    const normalizeSections = React.useCallback(
        (sections: Section[]) =>
            [...sections]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => ({
                    ...section,
                    input_type: resolveInputType(section),
                    value: section.value ?? "",
                })),
        []
    );

    const buildSectionsFromTemplate = React.useCallback(
        (sourceTemplate: JournalTemplate, valuesByKey: Record<string, string>) =>
            [...sourceTemplate.sections]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => ({
                    ...section,
                    input_type: resolveInputType(section),
                    value: valuesByKey[section.key] ?? "",
                })),
        []
    );

    const initialSections: Section[] = React.useMemo(() => {
        if (todayJournal?.sections?.length) {
            return normalizeSections(todayJournal.sections);
        }

        return buildSectionsFromTemplate(resolvedTemplate, {});
    }, [buildSectionsFromTemplate, normalizeSections, resolvedTemplate, todayJournal]);

    const initialTemplateSlug =
        todayJournal?.template_slug ?? resolvedTemplate.slug;

    const {
        data,
        setData,
        post,
        processing,
        errors,
        setError,
        clearErrors,
    } = useForm<{
        date: string;
        template_slug: string;
        sections: Section[];
    }>({
        date: todayJournal?.date ?? today,
        template_slug: initialTemplateSlug,
        sections: initialSections,
    });
    const [showGuide, setShowGuide] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(
        presetSavedMessage ?? null
    );
    const [guestProcessing, setGuestProcessing] = React.useState(false);
    const isProcessing = processing || guestProcessing;
    const draftSaveTimerRef = React.useRef<number | null>(null);
    const initialLoadRef = React.useRef(false);
    const autosaveAttemptedRef = React.useRef(false);
    const submitLabel = isGuest
        ? "Get feedback"
        : hasTodayJournal
          ? "保存（更新）"
          : "フィードバックを作成";
    const processingLabel = isGuest
        ? "Saving & generating feedback..."
        : hasTodayJournal
          ? "更新中..."
          : "保存中...";

    const clearTodayDraft = React.useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        clearJournalDraft(today);
        if (draftSaveTimerRef.current !== null) {
            window.clearTimeout(draftSaveTimerRef.current);
            draftSaveTimerRef.current = null;
        }
    }, [today]);

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
        if (!isGuest) {
            return;
        }

        const guestMessage = consumeGuestPresetMessage();
        if (guestMessage) {
            setToastMessage(guestMessage);
        }
    }, [isGuest]);

    React.useEffect(() => {
        if (initialLoadRef.current) {
            return;
        }

        if (isGuest) {
            initialLoadRef.current = true;
            return;
        }

        if (hasTodayJournal) {
            clearTodayDraft();
            initialLoadRef.current = true;
            return;
        }

        const draft = loadJournalDraft(today);
        if (!draft) {
            initialLoadRef.current = true;
            return;
        }

        const draftTemplate = availableTemplates.find(
            (item) => item.slug === draft.template_slug
        );

        if (!draftTemplate) {
            clearJournalDraft(today);
            initialLoadRef.current = true;
            return;
        }

        const templateKeys = draftTemplate.sections.map((section) => section.key);
        const draftKeys = Object.keys(draft.sections ?? {});
        const hasMatchingKeys =
            templateKeys.length === draftKeys.length &&
            templateKeys.every((key) => draftKeys.includes(key));

        if (!hasMatchingKeys) {
            clearJournalDraft(today);
            initialLoadRef.current = true;
            return;
        }

        const sanitizedValues: Record<string, string> = {};
        templateKeys.forEach((key) => {
            const value = draft.sections[key];
            sanitizedValues[key] = typeof value === "string" ? value : "";
        });

        setData("template_slug", draft.template_slug);
        setData(
            "sections",
            buildSectionsFromTemplate(draftTemplate, sanitizedValues)
        );
        initialLoadRef.current = true;
    }, [
        availableTemplates,
        buildSectionsFromTemplate,
        clearTodayDraft,
        hasTodayJournal,
        isGuest,
        setData,
        today,
    ]);

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

    React.useEffect(() => {
        return () => {
            if (typeof window === "undefined") {
                return;
            }

            if (draftSaveTimerRef.current !== null) {
                window.clearTimeout(draftSaveTimerRef.current);
            }
        };
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

    const buildGuestPendingPayload = React.useCallback(
        (pending: GuestPendingSave) => ({
            date: pending.entry.date,
            template_slug: pending.template_slug,
            sections: pending.entry.sections.map((section) => ({
                key: section.key,
                value: section.value ?? "",
                title_en: section.title_en ?? null,
                title_ja: section.title_ja ?? null,
                order: section.order ?? null,
                input_type: resolveInputType(section),
            })),
            feedback: pending.entry.feedback
                ? {
                      english_text:
                          pending.entry.feedback.english_text ?? null,
                      feedback_overall:
                          pending.entry.feedback.feedback_overall ?? null,
                      feedback_corrections:
                          pending.entry.feedback.feedback_corrections ?? [],
                      key_phrase_en:
                          pending.entry.feedback.key_phrase_en ?? null,
                      key_phrase_ja:
                          pending.entry.feedback.key_phrase_ja ?? null,
                      key_phrase_reason_ja:
                          pending.entry.feedback.key_phrase_reason_ja ?? null,
                  }
                : null,
        }),
        []
    );

    const scheduleDraftSave = (nextSections: Section[]) => {
        if (isGuest || hasTodayJournal) {
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        if (draftSaveTimerRef.current !== null) {
            window.clearTimeout(draftSaveTimerRef.current);
        }

        draftSaveTimerRef.current = window.setTimeout(() => {
            const payload: Record<string, string> = {};
            nextSections.forEach((section) => {
                payload[section.key] = section.value ?? "";
            });

            saveJournalDraft(today, {
                version: 1,
                template_slug: data.template_slug,
                sections: payload,
                updated_at: Math.floor(Date.now() / 1000),
            });
        }, 400);
    };

    const handleChangeSection = (index: number, value: string) => {
        const nextSections = data.sections.map((s, i) =>
            i === index ? { ...s, value } : s
        );
        setData("sections", nextSections);
        scheduleDraftSave(nextSections);
    };

    const mapGuestErrors = (payload: Record<string, string[]>) => {
        const mapped: Record<string, string> = {};

        Object.entries(payload).forEach(([field, messages]) => {
            if (!messages[0]) {
                return;
            }

            if (field === "sections_json") {
                mapped.sections = messages[0];
                return;
            }

            if (field === "template_slug") {
                mapped.sections = messages[0];
                return;
            }

            if (field.startsWith("sections_json.")) {
                const parts = field.split(".");
                const index = Number(parts[1] ?? -1);
                if (!Number.isNaN(index)) {
                    mapped[`sections.${index}.value`] = messages[0];
                }
            }
        });

        return mapped;
    };

    const getCsrfToken = React.useCallback(() => {
        if (typeof document === "undefined") {
            return "";
        }

        return (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") ?? ""
        );
    }, []);

    const clearAutosaveParam = React.useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("autosave");
        window.history.replaceState({}, "", url.toString());
    }, []);

    React.useEffect(() => {
        if (isGuest) {
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        if (autosaveAttemptedRef.current) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("autosave") !== "1") {
            return;
        }

        autosaveAttemptedRef.current = true;

        const pending = loadGuestPendingSave();
        if (!pending) {
            clearAutosaveParam();
            return;
        }

        const hasTemplate = availableTemplates.some(
            (candidate) => candidate.slug === pending.template_slug
        );

        if (hasTemplate) {
            setData("template_slug", pending.template_slug);
        }

        setData("date", pending.entry.date);
        setData(
            "sections",
            normalizeSections(pending.entry.sections as Section[])
        );

        const runAutosave = async () => {
            try {
                const response = await fetch(route("journal.guest.store"), {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": getCsrfToken(),
                    },
                    body: JSON.stringify(buildGuestPendingPayload(pending)),
                });

                if (response.ok) {
                    clearGuestPendingSave();
                    setToastMessage("履歴に保存しました。");
                    clearAutosaveParam();
                }
            } catch (error) {
                // Keep pending data for retry.
            }
        };

        void runAutosave();
    }, [
        availableTemplates,
        buildGuestPendingPayload,
        clearAutosaveParam,
        clearGuestPendingSave,
        getCsrfToken,
        isGuest,
        normalizeSections,
        setData,
        setToastMessage,
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isGuest) {
            post(route("journal.store"), {
                onSuccess: () => {
                    clearTodayDraft();
                },
            });
            return;
        }

        setGuestProcessing(true);
        clearErrors();

        const payload = {
            date: data.date,
            template_slug: data.template_slug,
            sections_json: data.sections.map((section) => ({
                key: section.key,
                title_en: section.title_en,
                title_ja: section.title_ja,
                order: section.order,
                input_type: resolveInputType(section),
                value: section.value,
            })),
        };

        try {
            const response = await fetch(route("api.guest.feedback"), {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            let body: any = null;
            try {
                body = await response.json();
            } catch (error) {
                body = null;
            }

            if (!response.ok) {
                if (response.status === 422 && body?.errors) {
                    const mapped = mapGuestErrors(body.errors);
                    if (Object.keys(mapped).length > 0) {
                        setError(mapped);
                        return;
                    }
                }

                setError(
                    "sections",
                    body?.message ?? "フィードバックの生成に失敗しました。"
                );
                return;
            }

            if (body?.entry) {
                saveGuestFeedbackEntry(body.entry);
                saveGuestPendingSave({
                    entry: body.entry,
                    template_slug: data.template_slug,
                });
                router.visit(route("guest.feedback", { guest: 1 }));
                return;
            }

            setError("sections", "フィードバックの生成に失敗しました。");
        } catch (error) {
            setError("sections", "通信に失敗しました。");
        } finally {
            setGuestProcessing(false);
        }
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
                                            ""
                                        }
                                        error={errorMessage}
                                        disabled={isProcessing}
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
                                    disabled={isProcessing}
                                    className="px-4 py-2.5"
                                >
                                    {isProcessing
                                        ? processingLabel
                                        : submitLabel}
                                </GlassButton>
                                {isProcessing && (
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
