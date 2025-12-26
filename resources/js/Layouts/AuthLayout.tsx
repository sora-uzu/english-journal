import GlassBackground from '@/Components/ui/GlassBackground';
import GlassCard from '@/Components/ui/GlassCard';
import { PropsWithChildren, ReactNode } from 'react';

type AuthLayoutProps = PropsWithChildren<{
    title: string;
    subtitle?: string;
    header?: ReactNode;
    cardClassName?: string;
}>;

export default function AuthLayout({
    title,
    subtitle,
    header,
    cardClassName = '',
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <GlassBackground />
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-2 text-sm text-slate-500">
                            {subtitle}
                        </p>
                    )}
                    {header}
                </div>

                <GlassCard className={`p-6 ${cardClassName}`}>
                    {children}
                </GlassCard>
            </div>
        </div>
    );
}
