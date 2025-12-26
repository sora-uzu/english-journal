import PrimaryButton from '@/Components/PrimaryButton';

type HowToGuideModalProps = {
    open: boolean;
    onClose: () => void;
};

export default function HowToGuideModal({
    open,
    onClose,
}: HowToGuideModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-guide-title"
        >
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-7">
                    <h2
                        id="how-to-guide-title"
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                    >
                        HOW TO USE THIS JOURNAL
                    </h2>
                    <ul className="mt-4 space-y-2 text-sm text-gray-700">
                        <li>
                            ・日本語でも英語でも、どちらで書いてもOKです。
                        </li>
                        <li>
                            ・1日1つ、3分くらいで「今日の気分」や「やったこと」を自由に書いてください。
                        </li>
                        <li>
                            ・Get feedback を押すと、自然な英語の文章と、その日のキーフレーズが返ってきます。
                        </li>
                    </ul>
                    <div className="mt-6 flex justify-end">
                        <PrimaryButton
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 text-xs font-medium normal-case tracking-normal"
                        >
                            Got it
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
