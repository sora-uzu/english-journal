import { Head, router } from '@inertiajs/react';

export default function Landing() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <Head title="English Journal" />

            <div className="w-full max-w-sm">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        English Journal
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        3分だけの、静かな英語日記。
                    </p>
                </div>

                <div className="mt-7 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
                    <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
                        <li>・英語でも日本語でも、ひとこと書くだけ</li>
                        <li>・1日1回、気分や出来事を3分でメモ</li>
                        <li>
                            ・AIが自然な英文と、明日も使えるフレーズを返してくれます
                        </li>
                    </ul>

                    <div className="mt-6 space-y-3">
                        <button
                            type="button"
                            onClick={() => router.get(route('login'))}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                        >
                            ログイン
                        </button>
                        <button
                            type="button"
                            onClick={() => router.get(route('register'))}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            新規登録
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
