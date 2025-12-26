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
        <AuthLayout title="Confirm Password">
            <Head title="Confirm Password" />

            <p className="text-sm text-slate-600">
                This is a secure area of the application. Please confirm your
                password before continuing.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
                <GlassInput
                    id="password"
                    type="password"
                    name="password"
                    label="Password"
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
                    Confirm
                </GlassButton>
            </form>
        </AuthLayout>
    );
}
