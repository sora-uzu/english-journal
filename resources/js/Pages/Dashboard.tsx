import AppLayout from '@/Layouts/AppLayout';
import GlassCard from '@/Components/ui/GlassCard';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AppLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <GlassCard className="p-6">
                        <div className="text-slate-900">
                            You're logged in!
                        </div>
                    </GlassCard>
                </div>
            </div>
        </AppLayout>
    );
}
