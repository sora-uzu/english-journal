export type JournalSectionInputType = "text" | "textarea";

export type JournalTemplateSection = {
    key: string;
    title_en: string;
    title_ja?: string;
    placeholder_en?: string;
    placeholder_ja?: string;
    order: number;
    input_type?: JournalSectionInputType;
    inputType?: JournalSectionInputType;
};

export type JournalTemplate = {
    slug: string;
    name: string;
    description?: string;
    sections: JournalTemplateSection[];
};

const GUEST_ACTIVE_TEMPLATE_KEY = "english-journal:guestActiveTemplateSlug";
const GUEST_CUSTOM_TEMPLATE_KEY = "english-journal:guestCustomTemplate";
const GUEST_PRESET_MESSAGE_KEY = "english-journal:guestPresetMessage";

const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

export const loadGuestActiveTemplateSlug = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(GUEST_ACTIVE_TEMPLATE_KEY);
};

export const saveGuestActiveTemplateSlug = (slug: string) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(GUEST_ACTIVE_TEMPLATE_KEY, slug);
};

export const loadGuestCustomTemplate = (): JournalTemplate | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(GUEST_CUSTOM_TEMPLATE_KEY);
    const parsed = safeParse(raw);

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    if (!Array.isArray(parsed.sections)) {
        return null;
    }

    return parsed as JournalTemplate;
};

export const saveGuestCustomTemplate = (template: JournalTemplate | null) => {
    if (typeof window === "undefined") {
        return;
    }

    if (!template) {
        window.localStorage.removeItem(GUEST_CUSTOM_TEMPLATE_KEY);
        return;
    }

    window.localStorage.setItem(GUEST_CUSTOM_TEMPLATE_KEY, JSON.stringify(template));
};

export const consumeGuestPresetMessage = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const message = window.localStorage.getItem(GUEST_PRESET_MESSAGE_KEY);
    if (message) {
        window.localStorage.removeItem(GUEST_PRESET_MESSAGE_KEY);
    }
    return message;
};

export const saveGuestPresetMessage = (message: string) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(GUEST_PRESET_MESSAGE_KEY, message);
};
