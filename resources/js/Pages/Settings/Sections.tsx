import AppLayout from "@/Layouts/AppLayout";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import GlassInput from "@/Components/ui/GlassInput";
import GlassModal from "@/Components/ui/GlassModal";
import { PageProps } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import { FormEvent, useMemo, useState } from "react";
import {
    JournalTemplate,
    JournalTemplateSection,
    loadGuestActiveTemplateSlug,
    loadGuestCustomTemplate,
    saveGuestActiveTemplateSlug,
    saveGuestCustomTemplate,
    saveGuestPresetMessage,
} from "@/lib/journalTemplates";

const CUSTOM_SLUG = "custom";
const MIN_SECTIONS = 1;
const MAX_SECTIONS = 5;
const JAPANESE_PATTERN =
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF\uFF65-\uFF9F]/;

type TemplateSection = JournalTemplateSection;
type Template = JournalTemplate;

type EditableSection = {
    key: string;
    title_en: string;
    title_ja: string;
};

export default function Sections({
    templates,
    currentTemplateSlug,
}: PageProps<{ templates: Template[]; currentTemplateSlug: string }>) {
    const { props } = usePage<PageProps>();
    const isGuest = !props.auth.user;
    const systemTemplates = useMemo(
        () => templates.filter((template) => template.slug !== CUSTOM_SLUG),
        [templates]
    );
    const [availableTemplates, setAvailableTemplates] = useState<Template[]>(
        () => {
            if (!isGuest) {
                return templates;
            }

            const guestCustom = loadGuestCustomTemplate();
            if (!guestCustom) {
                return templates;
            }

            return [
                ...templates.filter(
                    (template) => template.slug !== guestCustom.slug
                ),
                guestCustom,
            ];
        }
    );

    const initialGuestSlug = isGuest ? loadGuestActiveTemplateSlug() : null;
    const { data, setData, put, processing, errors } = useForm({
        template_slug: initialGuestSlug ?? currentTemplateSlug,
    });
    const [guestSaving, setGuestSaving] = useState(false);
    const isSaving = processing || guestSaving;

    const [customEditorOpen, setCustomEditorOpen] = useState(false);
    const [customMode, setCustomMode] = useState<"create" | "edit">("create");
    const [baseTemplateSlug, setBaseTemplateSlug] = useState("blank");
    const [customSections, setCustomSections] = useState<EditableSection[]>([]);
    const [customSectionErrors, setCustomSectionErrors] = useState<
        Record<string, string>
    >({});
    const [customErrorMessage, setCustomErrorMessage] = useState<string | null>(
        null
    );
    const [customProcessing, setCustomProcessing] = useState(false);
    const [setActiveOnSave, setSetActiveOnSave] = useState(true);

    const customTemplate =
        availableTemplates.find((template) => template.slug === CUSTOM_SLUG) ??
        null;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (isGuest) {
            setGuestSaving(true);
            saveGuestActiveTemplateSlug(data.template_slug);

            const templateName =
                availableTemplates.find(
                    (template) => template.slug === data.template_slug
                )?.name ?? null;

            saveGuestPresetMessage(
                templateName
                    ? `プリセット「${templateName}」を保存しました。`
                    : "プリセットを保存しました。"
            );

            window.location.href = route("journal.create");
            return;
        }

        put(route("settings.sections.update"));
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

    const generateSectionKey = () => {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
            return crypto.randomUUID();
        }

        return `custom-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
    };

    const createEmptySection = (): EditableSection => ({
        key: generateSectionKey(),
        title_en: "",
        title_ja: "",
    });

    const buildEditableFromTemplate = (template: Template | null) => {
        if (!template || template.sections.length === 0) {
            return [createEmptySection()];
        }

        const sorted = [...template.sections].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        return sorted.map((section) => ({
            key: generateSectionKey(),
            title_en: section.title_en ?? "",
            title_ja: section.title_ja ?? "",
        }));
    };

    const buildEditableFromCustom = (template: Template | null) => {
        if (!template || template.sections.length === 0) {
            return [createEmptySection()];
        }

        const sorted = [...template.sections].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );

        return sorted.map((section) => ({
            key: section.key,
            title_en: section.title_en ?? "",
            title_ja: section.title_ja ?? "",
        }));
    };

    const openCustomEditor = (mode: "create" | "edit") => {
        setCustomMode(mode);
        setCustomSectionErrors({});
        setCustomErrorMessage(null);

        if (mode === "edit" && customTemplate) {
            setCustomSections(buildEditableFromCustom(customTemplate));
            setSetActiveOnSave(data.template_slug === CUSTOM_SLUG);
        } else {
            setBaseTemplateSlug("blank");
            setCustomSections([createEmptySection()]);
            setSetActiveOnSave(true);
        }

        setCustomEditorOpen(true);
    };

    const handleBaseTemplateChange = (slug: string) => {
        setBaseTemplateSlug(slug);
        setCustomSectionErrors({});
        setCustomErrorMessage(null);

        if (slug === "blank") {
            setCustomSections([createEmptySection()]);
            return;
        }

        const template = systemTemplates.find(
            (candidate) => candidate.slug === slug
        );
        setCustomSections(buildEditableFromTemplate(template ?? null));
    };

    const updateCustomTemplate = (preset: Template | null) => {
        setAvailableTemplates((current) => {
            const withoutCustom = current.filter(
                (template) => template.slug !== CUSTOM_SLUG
            );
            if (!preset) {
                return withoutCustom;
            }

            return [...withoutCustom, preset];
        });
    };

    const moveSection = (index: number, direction: number) => {
        setCustomSections((prev) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= prev.length) {
                return prev;
            }

            const next = [...prev];
            const temp = next[index];
            next[index] = next[nextIndex];
            next[nextIndex] = temp;
            return next;
        });
    };

    const removeSection = (index: number) => {
        setCustomSections((prev) => {
            if (prev.length <= MIN_SECTIONS) {
                return prev;
            }

            return prev.filter((_, idx) => idx !== index);
        });
    };

    const addSection = () => {
        setCustomSections((prev) => {
            if (prev.length >= MAX_SECTIONS) {
                return prev;
            }

            return [...prev, createEmptySection()];
        });
    };

    const handleSectionChange = (
        index: number,
        field: "title_en" | "title_ja",
        value: string
    ) => {
        setCustomSections((prev) =>
            prev.map((section, idx) =>
                idx === index ? { ...section, [field]: value } : section
            )
        );

        setCustomSectionErrors((prev) => {
            const sectionKey = customSections[index]?.key;
            if (!sectionKey || !prev[sectionKey]) {
                return prev;
            }

            const next = { ...prev };
            delete next[sectionKey];
            return next;
        });
    };

    const validateCustomSections = () => {
        const sectionErrors: Record<string, string> = {};

        if (customSections.length < MIN_SECTIONS) {
            setCustomErrorMessage("セクションは1つ以上必要です。");
            setCustomSectionErrors({});
            return false;
        }

        if (customSections.length > MAX_SECTIONS) {
            setCustomErrorMessage("セクションは5つまで作成できます。");
            setCustomSectionErrors({});
            return false;
        }

        customSections.forEach((section) => {
            const titleEn = section.title_en.trim();

            if (!titleEn) {
                sectionErrors[section.key] = "英語タイトルは必須です。";
                return;
            }

            if (JAPANESE_PATTERN.test(titleEn)) {
                sectionErrors[section.key] =
                    "英語タイトルは英語で入力してください。";
            }
        });

        setCustomSectionErrors(sectionErrors);

        if (Object.keys(sectionErrors).length > 0) {
            setCustomErrorMessage(null);
            return false;
        }

        setCustomErrorMessage(null);
        return true;
    };

    const saveCustomPreset = async () => {
        if (!validateCustomSections()) {
            return;
        }

        setCustomProcessing(true);
        setCustomErrorMessage(null);

        if (isGuest) {
            const customTemplate: Template = {
                slug: CUSTOM_SLUG,
                name: "Custom",
                description: "Your own section layout",
                sections: customSections.map((section, index) => ({
                    key: section.key,
                    title_en: section.title_en.trim(),
                    title_ja: section.title_ja.trim(),
                    order: index + 1,
                    input_type: "textarea",
                })),
            };

            saveGuestCustomTemplate(customTemplate);
            updateCustomTemplate(customTemplate);

            if (setActiveOnSave) {
                setData("template_slug", CUSTOM_SLUG);
                saveGuestActiveTemplateSlug(CUSTOM_SLUG);
            }

            setCustomEditorOpen(false);
            setCustomProcessing(false);
            return;
        }

        const payload = {
            sections: customSections.map((section) => ({
                key: section.key,
                title_en: section.title_en.trim(),
                title_ja: section.title_ja.trim(),
            })),
            set_active: setActiveOnSave,
        };

        const method = customMode === "create" ? "POST" : "PUT";
        try {
            const response = await fetch("/api/presets/custom", {
                method,
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
                if (response.status === 409) {
                    setCustomErrorMessage(
                        "すでにCustom presetが存在します。編集をご利用ください。"
                    );
                } else if (response.status === 422 && body?.errors) {
                    const sectionErrors: Record<string, string> = {};
                    let generalMessage = body.errors.sections?.[0] ?? null;

                    Object.entries(body.errors).forEach(
                        ([field, messages]) => {
                            if (!Array.isArray(messages) || !messages[0]) {
                                return;
                            }

                            if (
                                field.startsWith("sections.") &&
                                field.endsWith(".title_en")
                            ) {
                                const index = Number(field.split(".")[1] ?? -1);
                                const sectionKey = customSections[index]?.key;

                                if (sectionKey) {
                                    sectionErrors[sectionKey] = messages[0];
                                }
                                if (!generalMessage) {
                                    generalMessage = messages[0];
                                }
                                return;
                            }

                            if (!generalMessage) {
                                generalMessage = messages[0];
                            }
                        }
                    );

                    if (Object.keys(sectionErrors).length > 0) {
                        setCustomSectionErrors(sectionErrors);
                    }

                    setCustomErrorMessage(
                        Object.keys(sectionErrors).length > 0
                            ? null
                            : generalMessage ?? "入力内容を確認してください。"
                    );
                } else {
                    setCustomErrorMessage(
                        body?.message ?? "保存に失敗しました。"
                    );
                }

                return;
            }

            if (body?.customPreset) {
                updateCustomTemplate(body.customPreset);
            }

            if (body?.activePresetSlug) {
                setData("template_slug", body.activePresetSlug);
            }

            setCustomEditorOpen(false);
        } catch (error) {
            setCustomErrorMessage("通信に失敗しました。");
        } finally {
            setCustomProcessing(false);
        }
    };

    const templateOptions = useMemo(() => {
        return [
            {
                slug: "blank",
                name: "Blank",
                description: "Start from scratch",
                sections: [] as TemplateSection[],
            },
            ...systemTemplates,
        ];
    }, [systemTemplates]);

    return (
        <AppLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Sections
                </h2>
            }
        >
            <Head title="Sections" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <GlassCard className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Choose your journal preset
                                </h3>
                                <p className="text-sm text-slate-600">
                                    使い慣れた構成から始められます。プリセットは後からいつでも切り替えできます。
                                </p>
                            </div>
                            {!customTemplate && (
                                <GlassButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() => openCustomEditor("create")}
                                    className="px-4 py-2.5"
                                >
                                    Create custom
                                </GlassButton>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {availableTemplates.map((template) => {
                                    const isSelected =
                                        data.template_slug === template.slug;
                                    const sortedSections = [
                                        ...template.sections,
                                    ].sort(
                                        (a, b) =>
                                            (a.order ?? 0) - (b.order ?? 0)
                                    );

                                    return (
                                        <label
                                            key={template.slug}
                                            className="group cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="template_slug"
                                                value={template.slug}
                                                checked={isSelected}
                                                onChange={() =>
                                                    setData(
                                                        "template_slug",
                                                        template.slug
                                                    )
                                                }
                                                className="sr-only"
                                            />
                                            <GlassCard
                                                className={`h-full p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_45px_rgba(15,23,42,0.2)] ${
                                                    isSelected
                                                        ? "border-violet-200/80 bg-white/70 ring-2 ring-violet-300/60"
                                                        : "border-white/60"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                aria-hidden="true"
                                                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                                                    isSelected
                                                                        ? "border-violet-400 bg-violet-100"
                                                                        : "border-slate-300"
                                                                }`}
                                                            >
                                                                {isSelected && (
                                                                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                                                                )}
                                                            </span>
                                                            <h4 className="text-sm font-semibold text-slate-900">
                                                                {template.name}
                                                            </h4>
                                                        </div>
                                                        {template.description && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {template.slug === CUSTOM_SLUG && (
                                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                                                Custom
                                                            </span>
                                                        )}
                                                        {template.slug === CUSTOM_SLUG && (
                                                            <GlassButton
                                                                type="button"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-[11px]"
                                                                aria-label="Edit custom preset"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    openCustomEditor(
                                                                        customTemplate
                                                                            ? "edit"
                                                                            : "create"
                                                                    );
                                                                }}
                                                            >
                                                                Edit
                                                            </GlassButton>
                                                        )}
                                                        {isSelected && (
                                                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-2">
                                                    {sortedSections.map((section) => (
                                                        <div
                                                            key={section.key}
                                                            className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2"
                                                        >
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {section.title_en}
                                                            </span>
                                                            {section.title_ja && (
                                                                <span className="text-[11px] text-slate-500">
                                                                    {section.title_ja}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 text-[11px] font-medium text-slate-500">
                                                    {sortedSections.length} sections
                                                </div>
                                            </GlassCard>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.template_slug && (
                                <p className="mt-3 text-xs text-rose-600">
                                    {errors.template_slug}
                                </p>
                            )}

                            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                                <GlassButton
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2.5"
                                >
                                    {isSaving ? "Saving..." : "Save preset"}
                                </GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>

            <GlassModal
                open={customEditorOpen}
                onClose={() => setCustomEditorOpen(false)}
                ariaLabelledby="custom-preset-title"
                containerClassName="max-w-3xl"
            >
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3
                            id="custom-preset-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            {customMode === "edit"
                                ? "Edit custom preset"
                                : "Create custom preset"}
                        </h3>
                        <p className="text-sm text-slate-600">
                            セクションは1〜5件まで。英語タイトルは必須です。
                        </p>
                    </div>

                    {customMode === "create" && (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-800">
                                Choose a starter template (optional)
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {templateOptions.map((template) => {
                                    const isSelected =
                                        baseTemplateSlug === template.slug;
                                    const count =
                                        template.slug === "blank"
                                            ? 1
                                            : template.sections.length;

                                    return (
                                        <label
                                            key={template.slug}
                                            className="cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="base_template"
                                                value={template.slug}
                                                checked={isSelected}
                                                onChange={() =>
                                                    handleBaseTemplateChange(
                                                        template.slug
                                                    )
                                                }
                                                className="sr-only"
                                            />
                                            <div
                                                className={`rounded-2xl border px-4 py-3 transition ${
                                                    isSelected
                                                        ? "border-violet-300/70 bg-violet-50/70"
                                                        : "border-white/70 bg-white/60"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {template.name}
                                                        </p>
                                                        {template.description && (
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {template.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {count} sections
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                                Sections
                            </p>
                            <span className="text-xs text-slate-500">
                                {customSections.length}/{MAX_SECTIONS}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {customSections.map((section, index) => {
                                const sectionError =
                                    customSectionErrors[section.key];

                                return (
                                    <div
                                        key={section.key}
                                        className="rounded-2xl border border-white/70 bg-white/60 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                                                    {index + 1}
                                                </span>
                                                <span>Section</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <GlassButton
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-8 px-3 text-xs"
                                                    onClick={() =>
                                                        moveSection(index, -1)
                                                    }
                                                    disabled={index === 0}
                                                >
                                                    Up
                                                </GlassButton>
                                                <GlassButton
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-8 px-3 text-xs"
                                                    onClick={() =>
                                                        moveSection(index, 1)
                                                    }
                                                    disabled={
                                                        index ===
                                                        customSections.length -
                                                            1
                                                    }
                                                >
                                                    Down
                                                </GlassButton>
                                                <GlassButton
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-8 px-3 text-xs text-rose-600"
                                                    onClick={() =>
                                                        removeSection(index)
                                                    }
                                                    disabled={
                                                        customSections.length <=
                                                        MIN_SECTIONS
                                                    }
                                                >
                                                    Delete
                                                </GlassButton>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <GlassInput
                                                id={`section-en-${section.key}`}
                                                label="English title"
                                                value={section.title_en}
                                                onChange={(event) =>
                                                    handleSectionChange(
                                                        index,
                                                        "title_en",
                                                        event.target.value
                                                    )
                                                }
                                                required
                                                error={sectionError}
                                            />
                                            <GlassInput
                                                id={`section-ja-${section.key}`}
                                                label="Japanese subtitle (optional)"
                                                value={section.title_ja}
                                                onChange={(event) =>
                                                    handleSectionChange(
                                                        index,
                                                        "title_ja",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <GlassButton
                                type="button"
                                variant="secondary"
                                className="px-4 py-2"
                                onClick={addSection}
                                disabled={customSections.length >= MAX_SECTIONS}
                            >
                                + Add section
                            </GlassButton>
                            <p className="text-xs text-slate-500">
                                {customSections.length >= MAX_SECTIONS
                                    ? "Maximum 5 sections reached"
                                    : "Up to 5 sections"}
                            </p>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={setActiveOnSave}
                            onChange={(event) =>
                                setSetActiveOnSave(event.target.checked)
                            }
                            className="rounded border-slate-300 text-violet-500 focus:ring-violet-400"
                        />
                        Set as active
                    </label>

                    {customErrorMessage && (
                        <p className="text-sm text-rose-600">
                            {customErrorMessage}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <GlassButton
                            type="button"
                            variant="ghost"
                            className="px-4 py-2"
                            onClick={() => setCustomEditorOpen(false)}
                            disabled={customProcessing}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            type="button"
                            className="px-4 py-2"
                            onClick={saveCustomPreset}
                            disabled={customProcessing}
                        >
                            {customProcessing
                                ? "Saving..."
                                : "Save preset"}
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </AppLayout>
    );
}
