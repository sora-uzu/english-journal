import { Head, router } from '@inertiajs/react';
import GlassButton from '@/Components/ui/GlassButton';
import AuthLayout from '@/Layouts/AuthLayout';

export default function Landing() {
    return (
        <AuthLayout
            title="English Journal"
            subtitle="3分で続けられる、静かな英語日記アプリ"
        >
            <Head title="English Journal" />

            <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-700">
                    英語の勉強アプリではなく、あなたのための “静かなメモ帳”。
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                    1日3分、日本語でも英語でも、今日の気持ちや出来事をひとこと書くだけ。
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                    書いた内容から AI が自然な英語に整え、明日も使えるキーフレーズをそっと返します。
                </p>
            </div>

            <div className="mt-6 space-y-3">
                <GlassButton
                    type="button"
                    onClick={() => router.get(route('login'))}
                    className="w-full py-3"
                >
                    ログイン
                </GlassButton>
                <GlassButton
                    type="button"
                    variant="secondary"
                    onClick={() => router.get(route('register'))}
                    className="w-full py-3"
                >
                    新規登録
                </GlassButton>
                <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => router.get(route('journal.create'))}
                    className="w-full border border-slate-200/80 bg-white/90 py-3 text-slate-800 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
                >
                    ゲストで試す
                </GlassButton>
            </div>
        </AuthLayout>
    );
}
