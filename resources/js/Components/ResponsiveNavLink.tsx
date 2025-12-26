import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-indigo-300 bg-white/60 text-indigo-700 focus:border-indigo-400 focus:bg-white/70 focus:text-indigo-800'
                    : 'border-transparent text-slate-600 hover:border-white/60 hover:bg-white/40 hover:text-slate-800 focus:border-white/60 focus:bg-white/40 focus:text-slate-800'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
