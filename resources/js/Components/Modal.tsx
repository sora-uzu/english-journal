import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto px-4 py-6 transition-all sm:items-center sm:px-0"
                onClose={close}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel
                        className={`relative mb-6 transform overflow-hidden rounded-3xl border border-white/60 bg-white/65 shadow-[0_28px_90px_-45px_rgba(2,6,23,0.40)] ring-1 ring-slate-900/5 backdrop-blur-3xl transition-all sm:mx-auto sm:w-full ${maxWidthClass}`}
                    >
                        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(120%_80%_at_15%_10%,rgba(255,255,255,0.75),rgba(255,255,255,0)_55%),linear-gradient(115deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_35%,rgba(255,255,255,0)_55%)] opacity-40" />
                        <div className="relative">{children}</div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
