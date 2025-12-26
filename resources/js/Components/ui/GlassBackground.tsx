export default function GlassBackground() {
    return (
        <div
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100" />
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl" />
            <div className="absolute top-1/3 -left-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute inset-0 opacity-10 [background-size:16px_16px] [background-image:radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)]" />
        </div>
    );
}
