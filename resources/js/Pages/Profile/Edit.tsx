import AppLayout from '@/Layouts/AppLayout';
import GlassCard from '@/Components/ui/GlassCard';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AppLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <GlassCard className="p-4 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </GlassCard>

                    <GlassCard className="p-4 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </GlassCard>

                    <GlassCard className="p-4 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
