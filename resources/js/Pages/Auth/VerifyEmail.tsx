import GlassButton from '@/Components/ui/GlassButton';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout title="メールアドレスの確認">
            <Head title="メールアドレスの確認" />

            <p className="text-sm text-slate-600">
                ご登録ありがとうございます。はじめる前に、先ほどお送りしたメールのリンクから
                メールアドレスの確認をお願いします。メールが届いていない場合は再送信できます。
            </p>

            {status === 'verification-link-sent' && (
                <p className="mt-4 rounded-2xl bg-emerald-50/70 px-3 py-2 text-xs text-emerald-700">
                    登録時のメールアドレス宛に確認リンクを再送信しました。
                </p>
            )}

            <form onSubmit={submit} className="mt-5 flex items-center gap-3">
                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2"
                >
                    確認メールを再送信
                </GlassButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                    ログアウト
                </Link>
            </form>
        </AuthLayout>
    );
}
