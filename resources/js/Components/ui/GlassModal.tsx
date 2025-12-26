import { PropsWithChildren } from 'react';

type GlassModalProps = PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    className?: string;
    containerClassName?: string;
    ariaLabelledby?: string;
}>;

export default function GlassModal({
    open,
    onClose,
    className = '',
    containerClassName = '',
    ariaLabelledby,
    children,
}: GlassModalProps) {
    if (!open) {
        return null;
    }

    const containerClasses = containerClassName
        ? `w-full ${containerClassName}`
        : 'w-full max-w-md';

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledby}
            onClick={onClose}
        >
            <div className={containerClasses} onClick={(e) => e.stopPropagation()}>
                <div
                    className={`relative overflow-hidden rounded-3xl border border-white/60 bg-white/65 shadow-[0_28px_90px_-45px_rgba(2,6,23,0.40)] ring-1 ring-slate-900/5 backdrop-blur-3xl ${className}`}
                >
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(120%_80%_at_15%_10%,rgba(255,255,255,0.75),rgba(255,255,255,0)_55%),linear-gradient(115deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_35%,rgba(255,255,255,0)_55%)] opacity-40" />
                    <div className="relative p-5 sm:p-6">{children}</div>
                </div>
            </div>
        </div>
    );
}
