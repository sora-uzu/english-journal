import type { FeedbackEntry } from "@/Components/FeedbackView";

const GUEST_FEEDBACK_ENTRY_KEY = "english-journal:guestFeedbackEntry";

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

export const clearGuestFeedbackEntry = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.sessionStorage.removeItem(GUEST_FEEDBACK_ENTRY_KEY);
};
