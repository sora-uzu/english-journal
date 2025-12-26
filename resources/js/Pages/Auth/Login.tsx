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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <Head title="ログイン" />

            <div className="w-full max-w-md">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        English Journal
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        3分で続けられる、静かな英語日記アプリ
                    </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
                    {status && (
                        <p className="mb-3 text-sm text-emerald-600">
                            {status}
                        </p>
                    )}
                    <form onSubmit={submit} className="space-y-4">
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
                                autoFocus
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
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
                                autoComplete="current-password"
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.password}
                                </p>
                            )}
                            <div className="mt-2 flex justify-end">
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-slate-500 hover:text-slate-600 hover:underline"
                                    title="Forgot your password?"
                                >
                                    パスワードをお忘れの方
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'ログイン中…' : 'ログイン'}
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center text-xs text-slate-500">
                    <span>アカウントをお持ちでない方は </span>
                    <Link
                        href={route('register')}
                        className="font-medium text-violet-600 hover:text-violet-700"
                    >
                        新規登録
                    </Link>
                </div>
            </div>
        </div>
    );
}
