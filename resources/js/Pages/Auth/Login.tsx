import GlassButton from '@/Components/ui/GlassButton';
import GlassInput from '@/Components/ui/GlassInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
}: {
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
    }>({
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="English Journal"
            subtitle="3分で続けられる、静かな英語日記アプリ"
        >
            <Head title="ログイン" />

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
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <div>
                    <GlassInput
                        id="password"
                        type="password"
                        name="password"
                        label="パスワード"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />
                    <div className="mt-2 flex justify-end">
                        <Link
                            href={route('password.request')}
                            className="text-xs text-slate-500 hover:text-slate-600 hover:underline"
                            title="パスワードをお忘れですか？"
                        >
                            パスワードをお忘れの方
                        </Link>
                    </div>
                </div>

                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="w-full py-3"
                >
                    {processing ? 'ログイン中…' : 'ログイン'}
                </GlassButton>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
                <span>アカウントをお持ちでない方は </span>
                <Link
                    href={route('register')}
                    className="font-medium text-violet-600 hover:text-violet-700"
                >
                    新規登録
                </Link>
            </div>
        </AuthLayout>
    );
}
