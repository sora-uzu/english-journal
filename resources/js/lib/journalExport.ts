type ExportSection = {
    key: string;
    title_en?: string | null;
    value?: string | null;
    order?: number | null;
};

type ExportCorrection = {
    before: string;
    after: string;
    note_ja: string;
};

type ExportFeedback = {
    english_text: string | null;
    feedback_corrections?: ExportCorrection[];
    key_phrase_en: string | null;
    key_phrase_ja: string | null;
    key_phrase_reason_ja?: string | null;
};

type ExportEntry = {
    date: string;
    sections: ExportSection[];
    feedback?: ExportFeedback | null;
};

const normalizeText = (value: string | null | undefined): string =>
    (value ?? "").replace(/\r\n/g, "\n");

const isShortText = (value: string | null | undefined): boolean =>
    normalizeText(value).trim().length <= 2;

const extractSummaryEn = (englishText: string): string => {
    const text = normalizeText(englishText).trim();
    if (text.length === 0) return "";

    // Prefer the first non-empty line as the base
    const firstLine = text
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 0) ??
        "";

    const base = firstLine.length > 0 ? firstLine : text;

    // Try to cut at the first sentence-ending punctuation.
    const match = base.match(/^(.+?[.!?])\s/);
    const sentence = match?.[1]?.trim() ?? base.trim();

    // Keep it compact for Notion meta.
    const max = 160;
    return sentence.length > max ? sentence.slice(0, max).trimEnd() + "…" : sentence;
};

const formatSectionAsBullets = (label: string, text: string): string[] => {
    const lines: string[] = [];
    const raw = normalizeText(text).trim();
    if (raw.length === 0) return lines;

    const parts = raw
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);

    if (parts.length === 0) return lines;

    // Keep everything on a single bullet line for Notion readability.
    // Use " / " as a safe separator for mixed JA/EN.
    const merged = parts.join(" / ");
    lines.push(`- **${label}:** ${merged}`);

    return lines;
};

const formatEnglishCleanAsBullets = (englishText: string): string[] => {
    const text = normalizeText(englishText).replace(/\s+/g, " ").trim();
    if (text.length === 0) return [];

    const markers = [
        { prefix: "Mood:", label: "Mood" },
        { prefix: "What I did:", label: "What I did" },
        { prefix: "Thoughts & Plans:", label: "Thoughts & Plans" },
    ];

    // Split into chunks starting at known prefixes
    const chunks = text
        .split(/(?=Mood:|What I did:|Thoughts & Plans:)/g)
        .map((c) => c.trim())
        .filter(Boolean);

    // If it doesn't contain prefixes, just return one bullet
    const hasKnownPrefix = chunks.some((c) => markers.some((m) => c.startsWith(m.prefix)));
    if (!hasKnownPrefix) {
        return [`- ${text}`];
    }

    const out: string[] = [];
    for (const chunk of chunks) {
        const marker = markers.find((m) => chunk.startsWith(m.prefix));
        if (!marker) continue;
        const body = chunk.slice(marker.prefix.length).trim();
        if (body.length === 0) continue;
        out.push(`- **${marker.label}:** ${body}`);
    }

    return out.length > 0 ? out : [`- ${text}`];
};

export const journalToMarkdown = (entry: ExportEntry): string => {
    const lines: string[] = [];
    const date = entry.date;
    const feedback = entry.feedback ?? null;
    const keyPhraseEn = normalizeText(feedback?.key_phrase_en ?? "").trim();
    const keyPhraseJa = normalizeText(feedback?.key_phrase_ja ?? "").trim();
    const keyPhraseReasonJa = normalizeText(feedback?.key_phrase_reason_ja ?? "").trim();
    const englishText = normalizeText(feedback?.english_text ?? "");

    lines.push(`# ${date} Journal`);
    lines.push("");
    lines.push("## Journal");

    const sections = [...(entry.sections ?? [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((section) => ({
            label: section.title_en?.trim() || section.key,
            text: normalizeText(section.value ?? "").trim(),
        }))
        .filter((section) => section.label && !isShortText(section.text));

    sections.forEach((section) => {
        lines.push(...formatSectionAsBullets(section.label, section.text));
    });

    lines.push("");
    lines.push("## Clean English");
    const englishLines = formatEnglishCleanAsBullets(englishText);
    if (englishLines.length > 0) {
        lines.push(...englishLines);
    }

    const keyPhraseLines: string[] = [];
    if (keyPhraseEn.length > 0 || keyPhraseJa.length > 0) {
        keyPhraseLines.push("");
        keyPhraseLines.push("## Key phrase");
        if (keyPhraseEn.length > 0) keyPhraseLines.push(`- EN: ${keyPhraseEn}`);
        if (keyPhraseJa.length > 0) keyPhraseLines.push(`- JA: ${keyPhraseJa}`);
        if (keyPhraseReasonJa.length > 0) keyPhraseLines.push(`- Reason (JA): ${keyPhraseReasonJa}`);
    }

    const corrections = feedback?.feedback_corrections ?? [];
    if (corrections.length > 0) {
        lines.push("");
        lines.push("## Corrections");

        corrections.forEach((correction, index) => {
            const before = normalizeText(correction.before).trim();
            const after = normalizeText(correction.after).trim();
            const note = normalizeText(correction.note_ja).trim();

            lines.push(`${index + 1}) **Before:** ${before}  `);
            lines.push(`   **After:** ${after}  `);
            if (note.length > 0) {
                lines.push(`   **Note(ja):** ${note}`);
            }
            if (index !== corrections.length - 1) {
                lines.push("");
            }
        });
    }

    if (keyPhraseLines.length > 0) {
        lines.push(...keyPhraseLines);
    }
    return lines.join("\n").trimEnd();
};

export const downloadText = (filename: string, text: string): void => {
    if (typeof window === "undefined") {
        return;
    }

    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
