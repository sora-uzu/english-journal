import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    }>({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <Head title="新しいパスワードを設定" />

            <div className="w-full max-w-md">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        新しいパスワードを設定
                    </h1>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-4">
                        <input type="hidden" name="token" value={data.token} />

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
                                新しいパスワード
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full rounded-xl border border-slate-300 text-sm focus:border-violet-500 focus:ring-violet-500"
                                autoComplete="new-password"
                                autoFocus
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
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
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value
                                    )
                                }
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
                            パスワードを更新する
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
