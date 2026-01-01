import { describe, expect, it } from "vitest";
import { journalToMarkdown } from "../journalExport";

describe("journalToMarkdown", () => {
    it("skips short sections in the Journal block", () => {
        const entry = {
            date: "2025-01-01",
            sections: [
                { key: "short", title_en: "Short", value: "ok", order: 1 },
                { key: "long", title_en: "Long", value: "Hello", order: 2 },
            ],
            feedback: null,
        };

        const markdown = journalToMarkdown(entry);

        expect(markdown).toContain("## Journal");
        expect(markdown).toContain("- **Long:** Hello");
        expect(markdown).not.toContain("Short");
    });

    it("splits english_text by labels into Clean English bullets", () => {
        const entry = {
            date: "2025-01-02",
            sections: [
                { key: "mood", title_en: "How I feel", value: "ok", order: 1 },
                { key: "tomorrow", title_en: "Tomorrow", value: "ok", order: 2 },
            ],
            feedback: {
                english_text: "How I feel: I feel good.\nTomorrow: I will rest.",
                feedback_corrections: [],
                key_phrase_en: null,
                key_phrase_ja: null,
                key_phrase_reason_ja: null,
            },
        };

        const markdown = journalToMarkdown(entry);

        expect(markdown).toContain("## Clean English");
        expect(markdown).toContain("- **How I feel:** I feel good.");
        expect(markdown).toContain("- **Tomorrow:** I will rest.");
    });

    it("uses a single bullet when labels are not found", () => {
        const entry = {
            date: "2025-01-03",
            sections: [{ key: "free", title_en: "Free", value: "ok", order: 1 }],
            feedback: {
                english_text: "Plain english text.",
                feedback_corrections: [],
                key_phrase_en: null,
                key_phrase_ja: null,
                key_phrase_reason_ja: null,
            },
        };

        const markdown = journalToMarkdown(entry);

        expect(markdown).toContain("## Clean English");
        expect(markdown).toContain("- Plain english text.");
    });

    it("includes key phrases and corrections when present", () => {
        const entry = {
            date: "2025-01-04",
            sections: [{ key: "free", title_en: "Free", value: "ok", order: 1 }],
            feedback: {
                english_text: "Free: Hello.",
                feedback_corrections: [
                    {
                        before: "I go.",
                        after: "I went.",
                        note_ja: "Use past tense.",
                    },
                ],
                key_phrase_en: "take a break",
                key_phrase_ja: "take a break",
                key_phrase_reason_ja: "Common phrase.",
            },
        };

        const markdown = journalToMarkdown(entry);

        expect(markdown).toContain("## Corrections");
        expect(markdown).toContain("1) **Before:** I go.");
        expect(markdown).toContain("**After:** I went.");
        expect(markdown).toContain("**Note(ja):** Use past tense.");
        expect(markdown).toContain("## Key phrase");
        expect(markdown).toContain("- EN: take a break");
        expect(markdown).toContain("- JA: take a break");
        expect(markdown).toContain("- Reason (JA): Common phrase.");
    });
});
