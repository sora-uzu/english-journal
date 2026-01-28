export type JournalDraft = {
    version: 1;
    template_slug: string;
    sections: Record<string, string>;
    updated_at: number;
};

const DRAFT_KEY_PREFIX = "journalDraft:";

const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const buildDraftKey = (date: string) => `${DRAFT_KEY_PREFIX}${date}`;

export const saveJournalDraft = (date: string, draft: JournalDraft) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(buildDraftKey(date), JSON.stringify(draft));
};

export const loadJournalDraft = (date: string): JournalDraft | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(buildDraftKey(date));
    const parsed = safeParse(raw);

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    if (parsed.version !== 1) {
        return null;
    }

    if (typeof parsed.template_slug !== "string") {
        return null;
    }

    if (
        !parsed.sections ||
        typeof parsed.sections !== "object" ||
        Array.isArray(parsed.sections)
    ) {
        return null;
    }

    if (typeof parsed.updated_at !== "number") {
        return null;
    }

    return parsed as JournalDraft;
};

export const clearJournalDraft = (date: string) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(buildDraftKey(date));
};
