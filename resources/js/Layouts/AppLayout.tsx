import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import GlassBackground from '@/Components/ui/GlassBackground';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function AppLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { props, url } = usePage<PageProps>();
    const user = props.auth.user;
    const isJournalActive =
        url.startsWith('/journal') && !url.startsWith('/journal/history');
    const isHistoryActive = url.startsWith('/journal/history');

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const closeMobileMenu = () => setShowingNavigationDropdown(false);

    return (
        <div className="min-h-screen">
            <GlassBackground />
            <nav className="border-b border-white/40 bg-white/20 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-12 items-center justify-between sm:h-16">
                        <div className="flex items-center gap-8">
                            <Link
                                href={route('journal.create')}
                                className="text-lg font-semibold text-slate-900 sm:text-xl"
                            >
                                English Journal
                            </Link>

                            <div className="hidden space-x-4 sm:flex">
                                <NavLink
                                    href={route('journal.create')}
                                    active={isJournalActive}
                                >
                                    New journal
                                </NavLink>
                                <NavLink
                                    href={route('journal.history')}
                                    active={isHistoryActive}
                                >
                                    History
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-full bg-white/30 px-2 py-1.5 backdrop-blur">
                                            <button
                                                type="button"
                                                className="inline-flex items-center text-sm font-medium leading-4 text-slate-600 transition duration-150 ease-in-out hover:text-slate-800 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-white/80 backdrop-blur">
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-full bg-white/30 p-2 text-slate-600 transition duration-150 ease-in-out hover:bg-white/50 hover:text-slate-800 focus:outline-none"
                                aria-expanded={showingNavigationDropdown}
                                aria-label="Toggle navigation menu"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {showingNavigationDropdown && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm sm:hidden"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}

            <div
                className={`fixed inset-y-0 right-0 z-40 w-72 max-w-[80%] transform border-l border-white/40 bg-white/30 shadow-xl backdrop-blur-2xl transition-transform duration-200 sm:hidden ${
                    showingNavigationDropdown ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex h-14 items-center justify-between border-b border-white/40 px-4">
                    <span className="text-sm font-semibold text-slate-900">
                        Menu
                    </span>
                    <button
                        type="button"
                        className="rounded-full bg-white/40 p-2 text-slate-600 hover:bg-white/60 hover:text-slate-800 focus:outline-none"
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex h-[calc(100%-56px)] flex-col justify-between overflow-y-auto">
                    <div className="space-y-1 px-2 py-3">
                        <ResponsiveNavLink
                            href={route('journal.create')}
                            active={isJournalActive}
                            onClick={closeMobileMenu}
                        >
                            New journal
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('journal.history')}
                            active={isHistoryActive}
                            onClick={closeMobileMenu}
                        >
                            History
                        </ResponsiveNavLink>
                    </div>
                    <div className="space-y-2 border-t border-white/40 px-4 py-4">
                        <div>
                            <div className="text-base font-medium text-slate-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-slate-500">
                                {user.email}
                            </div>
                        </div>
                        <ResponsiveNavLink
                            method="post"
                            href={route('logout')}
                            as="button"
                            onClick={closeMobileMenu}
                            className="mt-2"
                        >
                            Log Out
                        </ResponsiveNavLink>
                    </div>
                </div>
            </div>

            {header && (
                <header className="border-b border-white/40 bg-white/20 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
