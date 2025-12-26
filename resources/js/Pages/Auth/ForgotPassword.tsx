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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <Head title="パスワード再設定" />

            <div className="w-full max-w-md">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        パスワード再設定
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
                    </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
                    {status && (
                        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
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
                                placeholder="you@example.com"
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

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            メールを送信
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center text-xs text-slate-500">
                    <Link
                        href={route('login')}
                        className="font-medium text-violet-600 hover:text-violet-700"
                    >
                        ログイン画面に戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
