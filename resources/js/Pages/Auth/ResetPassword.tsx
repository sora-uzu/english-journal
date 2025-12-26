import GlassButton from '@/Components/ui/GlassButton';
import GlassInput from '@/Components/ui/GlassInput';
import AuthLayout from '@/Layouts/AuthLayout';
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
        <AuthLayout title="新しいパスワードを設定">
            <Head title="新しいパスワードを設定" />

            <form onSubmit={submit} className="space-y-4">
                <input type="hidden" name="token" value={data.token} />

                <GlassInput
                    id="email"
                    type="email"
                    name="email"
                    label="メールアドレス"
                    value={data.email}
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <GlassInput
                    id="password"
                    type="password"
                    name="password"
                    label="新しいパスワード"
                    value={data.password}
                    autoComplete="new-password"
                    autoFocus
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <GlassInput
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    label="パスワード（確認用）"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) =>
                        setData('password_confirmation', e.target.value)
                    }
                    error={errors.password_confirmation}
                />

                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="w-full py-3"
                >
                    パスワードを更新する
                </GlassButton>
            </form>
        </AuthLayout>
    );
}
