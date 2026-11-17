import Link from "next/link";

export default function StudioNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-6 py-16 text-slate-100">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-800 bg-[#0b1218] p-8 shadow-[0_20px_70px_rgba(2,6,23,0.45)]">
        <div className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Studio
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-4 text-slate-400">
          This Studio screen does not exist or is not available in the current workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/studio"
            className="rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Back to Overview
          </Link>
          <Link
            href="/studio/pages"
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 font-semibold text-slate-100 transition hover:border-slate-600 hover:text-white"
          >
            Open Pages
          </Link>
        </div>
      </div>
    </main>
  );
}
