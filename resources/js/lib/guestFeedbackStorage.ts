import type { FeedbackEntry } from "@/Components/FeedbackView";

const GUEST_FEEDBACK_ENTRY_KEY = "english-journal:guestFeedbackEntry";
const GUEST_FEEDBACK_DRAFT_KEY = "guest.lastFeedbackDraft";
const GUEST_PENDING_SAVE_KEY = "english-journal:guestPendingSave";

export type GuestFeedbackDraft = {
    version: 1;
    template_slug: string;
    entry: FeedbackEntry;
    created_at: string;
};

export type GuestPendingSave = {
    version: 1;
    template_slug: string;
    entry: FeedbackEntry;
    created_at: string;
};

const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

export const saveGuestFeedbackEntry = (entry: FeedbackEntry) => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.setItem(
        GUEST_FEEDBACK_ENTRY_KEY,
        JSON.stringify(entry)
    );
};

export const saveGuestFeedbackDraft = ({
    entry,
    template_slug,
}: {
    entry: FeedbackEntry;
    template_slug: string;
}) => {
    if (typeof window === "undefined") {
        return;
    }

    const draft: GuestFeedbackDraft = {
        version: 1,
        template_slug,
        entry,
        created_at: new Date().toISOString(),
    };

    window.localStorage.setItem(
        GUEST_FEEDBACK_DRAFT_KEY,
        JSON.stringify(draft)
    );
};

export const saveGuestPendingSave = ({
    entry,
    template_slug,
}: {
    entry: FeedbackEntry;
    template_slug: string;
}) => {
    if (typeof window === "undefined") {
        return;
    }

    const pending: GuestPendingSave = {
        version: 1,
        template_slug,
        entry,
        created_at: new Date().toISOString(),
    };

    window.localStorage.setItem(
        GUEST_PENDING_SAVE_KEY,
        JSON.stringify(pending)
    );
};

export const loadGuestFeedbackEntry = (): FeedbackEntry | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.sessionStorage.getItem(GUEST_FEEDBACK_ENTRY_KEY);
    const parsed = safeParse(raw);

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    return parsed as FeedbackEntry;
};

export const loadGuestFeedbackDraft = (): GuestFeedbackDraft | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(GUEST_FEEDBACK_DRAFT_KEY);
    const parsed = safeParse(raw);

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    if (
        typeof parsed.template_slug !== "string" ||
        typeof parsed.created_at !== "string"
    ) {
        return null;
    }

    if (!parsed.entry || typeof parsed.entry !== "object") {
        return null;
    }

    return parsed as GuestFeedbackDraft;
};

export const loadGuestPendingSave = (): GuestPendingSave | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(GUEST_PENDING_SAVE_KEY);
    const parsed = safeParse(raw);

    if (!parsed || typeof parsed !== "object") {
        return null;
    }

    if (parsed.version !== 1) {
        return null;
    }

    if (
        typeof parsed.template_slug !== "string" ||
        typeof parsed.created_at !== "string"
    ) {
        return null;
    }

    if (!parsed.entry || typeof parsed.entry !== "object") {
        return null;
    }

    return parsed as GuestPendingSave;
};

export const clearGuestFeedbackEntry = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.removeItem(GUEST_FEEDBACK_ENTRY_KEY);
};

export const clearGuestFeedbackDraft = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(GUEST_FEEDBACK_DRAFT_KEY);
};

export const clearGuestPendingSave = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(GUEST_PENDING_SAVE_KEY);
};
