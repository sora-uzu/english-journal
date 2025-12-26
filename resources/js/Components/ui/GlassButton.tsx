import { ButtonHTMLAttributes } from 'react';

type GlassButtonVariant = 'primary' | 'secondary' | 'ghost';

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: GlassButtonVariant;
};

const baseClasses =
    'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.985] active:translate-y-[1px] active:shadow-[0_12px_40px_-24px_rgba(2,6,23,0.45)] touch-manipulation disabled:cursor-not-allowed disabled:opacity-60';

const variantClasses: Record<GlassButtonVariant, string> = {
    primary:
        'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.45)] hover:from-purple-500 hover:to-purple-700',
    secondary:
        'border border-purple-100 bg-white/60 text-purple-600 shadow-[0_8px_18px_rgba(148,163,184,0.25)] hover:bg-white/70',
    ghost: 'bg-white/30 text-slate-600 hover:bg-white/50',
};

export default function GlassButton({
    variant = 'primary',
    className = '',
    disabled,
    type = 'button',
    ...props
}: GlassButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
}
