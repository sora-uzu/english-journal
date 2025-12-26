import { PropsWithChildren } from 'react';

type GlassCardProps = PropsWithChildren<{
    className?: string;
}>;

export default function GlassCard({ className = '', children }: GlassCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-3xl border border-white/60 bg-white/20 backdrop-blur-3xl shadow-[0_18px_45px_rgba(15,23,42,0.15)] ring-1 ring-white/20 ${className}`}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/10 to-transparent" />
            <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
            <div className="relative">{children}</div>
        </div>
    );
}
