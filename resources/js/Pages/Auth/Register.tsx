import GlassButton from '@/Components/ui/GlassButton';
import GlassInput from '@/Components/ui/GlassInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="新規登録"
            subtitle="3分だけ、英語で自分の1日を振り返ってみましょう。"
        >
            <Head title="新規登録" />

            <form onSubmit={submit} className="space-y-4">
                <GlassInput
                    id="name"
                    name="name"
                    label="名前"
                    value={data.name}
                    autoComplete="name"
                    autoFocus
                    placeholder="お名前"
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    required
                />
                <GlassInput
                    id="email"
                    type="email"
                    name="email"
                    label="メールアドレス"
                    value={data.email}
                    autoComplete="username"
                    placeholder="you@example.com"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                />
                <GlassInput
                    id="password"
                    type="password"
                    name="password"
                    label="パスワード"
                    value={data.password}
                    autoComplete="new-password"
                    placeholder="8文字以上"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />
                <GlassInput
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    label="パスワード（確認用）"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    placeholder="もう一度入力してください"
                    onChange={(e) =>
                        setData('password_confirmation', e.target.value)
                    }
                    error={errors.password_confirmation}
                    required
                />

                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="w-full py-3"
                >
                    登録する
                </GlassButton>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
                <span>すでにアカウントをお持ちの方はこちら </span>
                <Link
                    href={route('login')}
                    className="font-medium text-violet-600 hover:text-violet-700"
                >
                    ログイン
                </Link>
            </div>
            <div className="mt-2 text-center text-xs text-slate-500">
                <Link
                    href={route('password.request')}
                    className="hover:text-slate-600 hover:underline"
                >
                    パスワードを忘れた場合はこちら
                </Link>
            </div>
        </AuthLayout>
    );
}
