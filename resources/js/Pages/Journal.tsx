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
    GuestFeedbackDraft,
    clearGuestFeedbackDraft,
    loadGuestFeedbackDraft,
    saveGuestFeedbackDraft,
    saveGuestFeedbackEntry,
} from "@/lib/guestFeedbackStorage";

type Section = JournalTemplateSection & {
    value: string;
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
}: PageProps<{
    today: string;
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

    const initialSections: Section[] = React.useMemo(
        () =>
            [...resolvedTemplate.sections]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => ({
                    ...section,
                    input_type: resolveInputType(section),
                    value: "",
                })),
        [resolvedTemplate]
    );

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
        date: today,
        template_slug: resolvedTemplate.slug,
        sections: initialSections,
    });
    const [showGuide, setShowGuide] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(
        presetSavedMessage ?? null
    );
    const [guestProcessing, setGuestProcessing] = React.useState(false);
    const [guestDraft, setGuestDraft] =
        React.useState<GuestFeedbackDraft | null>(null);
    const [guestDraftSaving, setGuestDraftSaving] = React.useState(false);
    const [guestDraftError, setGuestDraftError] = React.useState<string | null>(
        null
    );
    const isProcessing = processing || guestProcessing;

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
        if (isGuest) {
            return;
        }

        const storedDraft = loadGuestFeedbackDraft();
        if (storedDraft) {
            setGuestDraft(storedDraft);
        }
    }, [isGuest]);

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

    const handleDiscardGuestDraft = () => {
        clearGuestFeedbackDraft();
        setGuestDraft(null);
        setGuestDraftError(null);
    };

    const buildGuestDraftPayload = (draft: GuestFeedbackDraft) => ({
        date: draft.entry.date,
        template_slug: draft.template_slug,
        sections: draft.entry.sections.map((section) => ({
            key: section.key,
            value: section.value ?? "",
            title_en: section.title_en ?? null,
            title_ja: section.title_ja ?? null,
            order: section.order ?? null,
            input_type: resolveInputType(section),
        })),
        feedback: draft.entry.feedback
            ? {
                  english_text: draft.entry.feedback.english_text ?? null,
                  feedback_overall:
                      draft.entry.feedback.feedback_overall ?? null,
                  feedback_corrections:
                      draft.entry.feedback.feedback_corrections ?? [],
                  key_phrase_en: draft.entry.feedback.key_phrase_en ?? null,
                  key_phrase_ja: draft.entry.feedback.key_phrase_ja ?? null,
                  key_phrase_reason_ja:
                      draft.entry.feedback.key_phrase_reason_ja ?? null,
              }
            : null,
    });

    const handleSaveGuestDraft = async () => {
        if (!guestDraft || guestDraftSaving) {
            return;
        }

        setGuestDraftSaving(true);
        setGuestDraftError(null);

        try {
            const response = await fetch(route("journal.guest.store"), {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
                body: JSON.stringify(buildGuestDraftPayload(guestDraft)),
            });

            let body: any = null;
            try {
                body = await response.json();
            } catch (error) {
                body = null;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    setGuestDraftError("ログインしてください。");
                    return;
                }

                if (body?.errors && typeof body.errors === "object") {
                    const firstError = Object.values(body.errors)
                        .flat()
                        .find(Boolean);
                    if (typeof firstError === "string") {
                        setGuestDraftError(firstError);
                        return;
                    }
                }

                setGuestDraftError(
                    body?.message ?? "保存に失敗しました。"
                );
                return;
            }

            clearGuestFeedbackDraft();
            setGuestDraft(null);
            setToastMessage("履歴に保存しました。");
        } catch (error) {
            setGuestDraftError("通信に失敗しました。");
        } finally {
            setGuestDraftSaving(false);
        }
    };

    const handleChangeSection = (index: number, value: string) => {
        setData(
            "sections",
            data.sections.map((s, i) =>
                i === index ? { ...s, value } : s
            )
        );
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

    const getCsrfToken = () => {
        if (typeof document === "undefined") {
            return "";
        }

        return (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") ?? ""
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isGuest) {
            post(route("journal.store"));
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
                saveGuestFeedbackDraft({
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
                    {!isGuest && guestDraft && (
                        <div className="mb-4">
                            <GlassCard className="border-amber-200/70 bg-amber-50/70 p-4 sm:p-5">
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-800">
                                        直前のフィードバックを履歴に保存しますか？
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        登録前に作成した日記とフィードバックを、そのまま保存できます。
                                    </p>
                                    {guestDraftError && (
                                        <p className="text-xs font-semibold text-rose-600">
                                            {guestDraftError}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <GlassButton
                                        type="button"
                                        className="px-4 py-2.5"
                                        onClick={handleSaveGuestDraft}
                                        disabled={guestDraftSaving}
                                    >
                                        保存する
                                    </GlassButton>
                                    <GlassButton
                                        type="button"
                                        variant="ghost"
                                        className="px-3 py-2 text-xs"
                                        onClick={handleDiscardGuestDraft}
                                        disabled={guestDraftSaving}
                                    >
                                        破棄
                                    </GlassButton>
                                </div>
                            </GlassCard>
                        </div>
                    )}
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
                                        ? "Saving & generating feedback..."
                                        : "Get feedback"}
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
