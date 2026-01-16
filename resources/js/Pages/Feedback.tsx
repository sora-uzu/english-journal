import AppLayout from "@/Layouts/AppLayout";
import FeedbackView, { FeedbackEntry } from "@/Components/FeedbackView";
import GlassButton from "@/Components/ui/GlassButton";
import GlassCard from "@/Components/ui/GlassCard";
import { loadGuestFeedbackEntry } from "@/lib/guestFeedbackStorage";
import { PageProps } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

type FeedbackPageProps = PageProps<{
    entry?: FeedbackEntry | null;
}>;

export default function Feedback({ entry: entryProp }: FeedbackPageProps) {
    const { props } = usePage<PageProps>();
    const isGuest = !props.auth.user;
    const [entry, setEntry] = useState<FeedbackEntry | null>(
        entryProp ?? null
    );
    const [hasChecked, setHasChecked] = useState(Boolean(entryProp));

    useEffect(() => {
        if (entryProp) {
            return;
        }

        const stored = loadGuestFeedbackEntry();
        if (stored) {
            setEntry(stored);
        }
        setHasChecked(true);
    }, [entryProp]);

    return (
        <AppLayout>
            <Head title="Feedback" />
            {!hasChecked ? (
                <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                    <GlassCard className="p-6 sm:p-8">
                        <p className="text-sm text-slate-600">
                            フィードバックを読み込んでいます。
                        </p>
                    </GlassCard>
                </div>
            ) : entry ? (
                <FeedbackView entry={entry} showGuestPrompt={isGuest} />
            ) : (
                <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                    <GlassCard className="p-6 sm:p-8">
                        <div className="space-y-3">
                            <p className="text-sm text-slate-700">
                                フィードバックが見つかりませんでした。もう一度日記を入力してください。
                            </p>
                            <GlassButton
                                type="button"
                                className="px-4 py-2.5"
                                onClick={() =>
                                    router.visit(route("journal.create"))
                                }
                            >
                                Journalへ戻る
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </AppLayout>
    );
}
