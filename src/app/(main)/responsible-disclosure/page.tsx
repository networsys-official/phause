export default function ResponsibleDisclosurePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Responsible Disclosure</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Responsible Disclosure</h1>
        <p className="mt-6 text-base leading-7 text-slate-300">
          Phause welcomes and values coordinated vulnerability disclosures from security researchers. If you identify a potential issue,
          please contact our security team privately so that we can assess and remediate it safely.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
          <p><strong className="text-white">How to report:</strong> send detailed technical information, reproduction steps, and impact analysis to our security contact channels.</p>
          <p><strong className="text-white">Guidelines:</strong> avoid destructive testing, do not access or exfiltrate unrelated data, and provide reasonable time for validation and remediation.</p>
          <p><strong className="text-white">Recognition:</strong> researchers who follow responsible disclosure guidelines may be recognized for their contribution to our security posture.</p>
        </div>
      </div>
    </main>
  );
}
