import GlassCard from '@/Components/ui/GlassCard';
import { PropsWithChildren } from 'react';

type GlassModalProps = PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    className?: string;
}>;

export default function GlassModal({
    open,
    onClose,
    className = '',
    children,
}: GlassModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <GlassCard className={`p-6 ${className}`}>{children}</GlassCard>
            </div>
        </div>
    );
}
