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
                        ・セクション構成は、画面右上のメニュー→「Sections」からプリセットを選んで切り替えできます。
                    </li>
                    <li>
                        ・Get feedback を押すと、自然な英語の文章と、その日のキーフレーズが返ってきます。
                    </li>
                </ul>
                <div className="mt-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900/85">
                        ADD TO HOME SCREEN
                    </h2>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-900/75">
                        <li>
                            ・iPhone：
                            <span className="inline-flex items-center gap-1">
                                共有
                                <span
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-900/15 bg-white/40"
                                    aria-label="共有"
                                    title="共有"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-4 w-4"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M12 3v10"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M8.5 6.5 12 3l3.5 3.5"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M7 10.5H6.2c-1 0-1.8.8-1.8 1.8v6.5c0 1 .8 1.8 1.8 1.8h11.6c1 0 1.8-.8 1.8-1.8v-6.5c0-1-.8-1.8-1.8-1.8H17"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                            </span>
                            →「ホーム画面に追加」
                        </li>
                        <li>
                            ・Android：︙メニュー →「ホーム画面に追加」または「インストール」
                        </li>
                    </ul>
                    <p className="mt-2 text-xs leading-relaxed text-slate-900/60">
                        ※見つからない場合は、メニューを下にスクロールして探してください
                    </p>
                </div>
                <div className="mt-6 flex justify-end">
                    <GlassButton
                        type="button"
                        onClick={onClose}
                        className="w-full px-5 py-2.5 text-sm font-semibold normal-case tracking-normal"
                    >
                        Got it
                    </GlassButton>
                </div>
            </div>
        </GlassModal>
    );
}
