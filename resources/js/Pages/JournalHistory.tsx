import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import React, { useMemo } from 'react';

type HistoryEntry = {
    id: number;
    date: string; // 'YYYY-MM-DD'
    hasEntry: boolean;
    key_phrase_en: string | null;
    key_phrase_ja: string | null;
};

type KeyPhrase = {
    id: number;
    date: string;
    key_phrase_en: string;
    key_phrase_ja: string | null;
};

type Props = {
    year: number;
    month: number; // 1〜12
    entries: HistoryEntry[];
    keyPhrases: KeyPhrase[];
};

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (year: number, month: number, day: number) => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
};

const findEntryByDate = (
    entries: HistoryEntry[],
    date: string,
): HistoryEntry | null => entries.find((e) => e.date === date) ?? null;

export default function JournalHistory() {
    const { props } = usePage<PageProps<Props>>();
    const { year, month, entries, keyPhrases } = props;

    const firstDay = new Date(year, month - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const entryMap = useMemo(() => {
        const map = new Map<string, HistoryEntry>();
        entries.forEach((entry) => map.set(entry.date, entry));
        return map;
    }, [entries]);

    const prevMonthDate = new Date(year, month - 2, 1);
    const nextMonthDate = new Date(year, month, 1);

    const prevParams = {
        year: prevMonthDate.getFullYear(),
        month: prevMonthDate.getMonth() + 1,
    };
    const nextParams = {
        year: nextMonthDate.getFullYear(),
        month: nextMonthDate.getMonth() + 1,
    };

    const baseDayClass =
        'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm';

    const leadingBlanks = Array(startWeekday).fill(null);
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = leadingBlanks.length + dayNumbers.length;
    const trailingBlanks = (7 - (totalCells % 7)) % 7;
    const cells: (number | null)[] = [
        ...leadingBlanks,
        ...dayNumbers,
        ...Array(trailingBlanks).fill(null),
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        History
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Check your past journals.
                    </p>
                </div>
            }
        >
            <Head title="History" />

            <div className="py-6">
                <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-md rounded-xl bg-white p-5 shadow">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-400">
                                    {year}
                                </p>
                                <p className="text-2xl font-semibold text-gray-800">
                                    {monthNames[month - 1]}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('journal.history', prevParams)}
                                    className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                                >
                                    ← Prev
                                </Link>
                                <Link
                                    href={route('journal.history', nextParams)}
                                    className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                                >
                                    Next →
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
                                {weekdayLabels.map((label) => (
                                    <div key={label} className="py-2">
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-y-3 text-sm">
                                {cells.map((day, idx) => {
                                    if (day === null) {
                                        return (
                                            <div
                                                key={`blank-${idx}`}
                                                className="flex items-center justify-center"
                                            />
                                        );
                                    }

                                    const dateStr = formatDate(
                                        year,
                                        month,
                                        day,
                                    );
                                    const entry =
                                        entryMap.get(dateStr) ??
                                        findEntryByDate(entries, dateStr);

                                    if (entry) {
                                        return (
                                            <div
                                                key={dateStr}
                                                className="flex items-center justify-center"
                                            >
                                                <Link
                                                    href={route(
                                                        'journal.show',
                                                        entry.id,
                                                    )}
                                                    className={`${baseDayClass} bg-indigo-500 text-white transition hover:bg-indigo-600`}
                                                >
                                                    {day}
                                                </Link>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={dateStr}
                                            className="flex items-center justify-center"
                                        >
                                            <div
                                                className={`${baseDayClass} cursor-default text-gray-400`}
                                            >
                                                {day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                This month&apos;s key phrases
                            </h3>
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                up to 3
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {keyPhrases.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    No key phrases yet this month.
                                </p>
                            )}

                            {keyPhrases.map((phrase) => (
                                <Link
                                    key={phrase.id}
                                    href={route('journal.show', phrase.id)}
                                    className="flex gap-3 rounded-lg border border-gray-200 px-3 py-2 transition hover:border-indigo-400 hover:bg-indigo-50"
                                >
                                    <div className="mt-0.5 text-amber-500">
                                        ⭐
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {phrase.key_phrase_en}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {phrase.date}
                                            {phrase.key_phrase_ja
                                                ? ` ・ ${phrase.key_phrase_ja}`
                                                : ''}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
