import GlassButton from '@/Components/ui/GlassButton';
import GlassInput from '@/Components/ui/GlassInput';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm<{
        password: string;
    }>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="パスワードの確認">
            <Head title="パスワードの確認" />

            <p className="text-sm text-slate-600">
                安全な操作のため、続行するにはパスワードをもう一度入力してください。
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <GlassInput
                    id="password"
                    type="password"
                    name="password"
                    label="パスワード"
                    value={data.password}
                    autoFocus
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <GlassButton
                    type="submit"
                    disabled={processing}
                    className="w-full py-3"
                >
                    確認する
                </GlassButton>
            </form>
        </AuthLayout>
    );
}
