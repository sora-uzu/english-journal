import GlassButton from '@/Components/ui/GlassButton';
import GlassInput from '@/Components/ui/GlassInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<{
        email: string;
    }>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="パスワード再設定"
            subtitle="登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。"
        >
            <Head title="パスワード再設定" />

            {status && (
                <p className="mb-4 rounded-2xl bg-emerald-50/70 px-3 py-2 text-xs text-emerald-700">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="space-y-4">
                <GlassInput
                    id="email"
                    type="email"
                    name="email"
                    label="メールアドレス"
                    value={data.email}
                    autoComplete="username"
                    placeholder="you@example.com"
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                />

                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="w-full py-3"
                >
                    メールを送信
                </GlassButton>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
                <Link
                    href={route('login')}
                    className="font-medium text-violet-600 hover:text-violet-700"
                >
                    ログイン画面に戻る
                </Link>
            </div>
        </AuthLayout>
    );
}
