import GlassButton from '@/Components/ui/GlassButton';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout title="Email Verification">
            <Head title="Email Verification" />

            <p className="text-sm text-slate-600">
                Thanks for signing up! Before getting started, could you verify
                your email address by clicking on the link we just emailed to
                you? If you didn&apos;t receive the email, we will gladly send
                you another.
            </p>

            {status === 'verification-link-sent' && (
                <p className="mt-4 rounded-2xl bg-emerald-50/70 px-3 py-2 text-xs text-emerald-700">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </p>
            )}

            <form onSubmit={submit} className="mt-5 flex items-center gap-3">
                <GlassButton type="submit" disabled={processing} className="px-4 py-2">
                    Resend Verification Email
                </GlassButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                    Log Out
                </Link>
            </form>
        </AuthLayout>
    );
}
