export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Cookie Policy</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Cookie Policy</h1>
        <p className="mt-6 text-base leading-7 text-slate-300">
          We use cookies and similar technologies to improve site performance, maintain security, understand product usage,
          and personalize relevant content. Cookies help us authenticate sessions, measure engagement, and protect against abuse.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
          <p><strong className="text-white">Essential cookies:</strong> required for secure login, session continuity, and website reliability.</p>
          <p><strong className="text-white">Analytics cookies:</strong> used to understand how visitors interact with our site and improve experience over time.</p>
          <p><strong className="text-white">Preference cookies:</strong> store user choices for branding, accessibility, and interface customization.</p>
        </div>
      </div>
    </main>
  );
}
