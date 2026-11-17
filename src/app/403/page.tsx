import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-red-900 bg-slate-900/80 p-10 text-center shadow-2xl shadow-red-950/20">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-red-300">403</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Access denied.</h1>
        <p className="mt-3 text-sm text-slate-300">Access denied. Your account does not have permission to access this resource.</p>
        <Link href="/studio" className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Return to dashboard</Link>
      </div>
    </div>
  );
}
