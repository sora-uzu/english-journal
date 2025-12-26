import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

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
    const [showAllPhrases, setShowAllPhrases] = useState(false);
    const hasAnyEntries = entries && entries.length > 0;

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
        'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm sm:h-10 sm:w-10 sm:text-sm md:h-9 md:w-9';

    const leadingBlanks = Array(startWeekday).fill(null);
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = leadingBlanks.length + dayNumbers.length;
    const trailingBlanks = (7 - (totalCells % 7)) % 7;
    const cells: (number | null)[] = [
        ...leadingBlanks,
        ...dayNumbers,
        ...Array(trailingBlanks).fill(null),
    ];
    const [firstPhrase, ...restPhrases] = keyPhrases;
    const hasRestPhrases = restPhrases.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="History" />

            <div className="pt-2 pb-4 sm:py-5 md:py-6">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-5 sm:p-6 shadow">
                        <div className="mb-3 sm:mb-6">
                            <p className="text-base font-semibold text-gray-900 sm:text-lg">
                                History
                            </p>
                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                Check your past journals.
                            </p>
                        </div>

                        {/* Mobile spacing tuned to keep header+calendar near the fold while staying readable */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="mx-auto w-full max-w-md">
                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-400">
                                            {year}
                                        </p>
                                        <p className="text-xl font-semibold text-gray-800 sm:text-2xl">
                                            {monthNames[month - 1]}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <Link
                                            href={route(
                                                'journal.history',
                                                prevParams,
                                            )}
                                            className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                                        >
                                            ← Prev
                                        </Link>
                                        <Link
                                            href={route(
                                                'journal.history',
                                                nextParams,
                                            )}
                                            className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                                        >
                                            Next →
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-4 sm:mt-6">
                                    <div className="grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
                                        {weekdayLabels.map((label) => (
                                            <div key={label} className="py-1.5 sm:py-2">
                                                {label}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-2.5 sm:gap-y-3 text-sm">
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

                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
                                        This month&apos;s key phrases
                                    </h3>
                                    <span className="text-xs uppercase tracking-wide text-gray-400">
                                        up to 3
                                    </span>
                                </div>

                                {keyPhrases.length === 0 ? (
                                    !hasAnyEntries ? (
                                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                NO JOURNALS YET
                                            </p>
                                            <p className="mt-2 text-sm text-slate-700">
                                                まだ日記がありません。
                                            </p>
                                            <p className="mt-1 text-sm text-slate-700">
                                                まずは New journal から、今日のことを日本語でも英語でも3分だけ書いてみましょう。
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 sm:mt-4 text-sm text-gray-600">
                                            <p>
                                                今月はまだキーフレーズがありません。
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                上の「New journal」から、今日の英語日記を書いてみませんか？
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <div className="mt-3 sm:mt-4 space-y-3">
                                            {firstPhrase && (
                                                <Link
                                                    key={firstPhrase.id}
                                                    href={route(
                                                        'journal.show',
                                                        firstPhrase.id,
                                                    )}
                                                    className="flex gap-3 rounded-lg border border-gray-200 px-3 py-2 transition hover:border-indigo-400 hover:bg-indigo-50"
                                                >
                                                    <div className="mt-0.5 text-amber-500">
                                                        ⭐
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {firstPhrase.key_phrase_en}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {firstPhrase.date}
                                                            {firstPhrase.key_phrase_ja
                                                                ? ` ・ ${firstPhrase.key_phrase_ja}`
                                                                : ''}
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}

                                            {hasRestPhrases && (
                                                <div
                                                    className={`space-y-3 ${showAllPhrases ? '' : 'hidden'}`}
                                                >
                                                    {restPhrases.map((phrase) => (
                                                        <Link
                                                            key={phrase.id}
                                                            href={route(
                                                                'journal.show',
                                                                phrase.id,
                                                            )}
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
                                            )}
                                        </div>

                                        {hasRestPhrases && (
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 transition hover:text-indigo-800 sm:mt-4"
                                                onClick={() =>
                                                    setShowAllPhrases((prev) => !prev)
                                                }
                                                aria-expanded={showAllPhrases}
                                            >
                                                <span className={showAllPhrases ? 'hidden' : 'inline'}>
                                                    {`Show all (${keyPhrases.length})`}
                                                </span>
                                                <span className={showAllPhrases ? 'inline' : 'hidden'}>
                                                    Hide
                                                </span>
                                                <svg
                                                    className={`ml-1 h-4 w-4 transition ${
                                                        showAllPhrases ? 'rotate-180' : ''
                                                    }`}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M6 9l6 6 6-6"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
