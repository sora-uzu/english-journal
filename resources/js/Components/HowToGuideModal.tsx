import GlassButton from '@/Components/ui/GlassButton';
import GlassModal from '@/Components/ui/GlassModal';

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
        <GlassModal
            open={open}
            onClose={onClose}
            containerClassName="max-w-lg"
            ariaLabelledby="how-to-guide-title"
        >
            <div className="max-h-[80vh] overflow-y-auto">
                <h2
                    id="how-to-guide-title"
                    className="text-sm font-semibold uppercase tracking-wide text-slate-900/85"
                >
                    HOW TO USE THIS JOURNAL
                </h2>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-900/75">
                    <li>・日本語でも英語でも、どちらで書いてもOKです。</li>
                    <li>
                        ・1日1つ、3分くらいで「今日の気分」や「やったこと」を自由に書いてください。
                    </li>
                    <li>
                        ・Get feedback を押すと、自然な英語の文章と、その日のキーフレーズが返ってきます。
                    </li>
                </ul>
                <div className="mt-6 flex justify-end">
                    <GlassButton
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 text-xs font-medium normal-case tracking-normal"
                    >
                        Got it
                    </GlassButton>
                </div>
            </div>
        </GlassModal>
    );
}
