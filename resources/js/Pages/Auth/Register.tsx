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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <Head title="新規登録" />

            <div className="w-full max-w-md">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        新規登録
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        3分だけ、英語で自分の1日を振り返ってみましょう。
                    </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="text-sm font-medium text-slate-700"
                            >
                                名前
                            </label>
                            <input
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full rounded-xl border border-slate-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                autoComplete="name"
                                autoFocus
                                placeholder="お名前"
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-slate-700"
                            >
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full rounded-xl border border-slate-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                autoComplete="username"
                                placeholder="you@example.com"
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-slate-700"
                            >
                                パスワード
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full rounded-xl border border-slate-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                autoComplete="new-password"
                                placeholder="8文字以上"
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                required
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className="text-sm font-medium text-slate-700"
                            >
                                パスワード（確認用）
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full rounded-xl border border-slate-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                autoComplete="new-password"
                                placeholder="もう一度入力してください"
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value
                                    )
                                }
                                required
                            />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            登録する
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center text-xs text-slate-500">
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
            </div>
        </div>
    );
}
