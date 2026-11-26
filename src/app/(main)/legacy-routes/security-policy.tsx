export default function SecurityPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Security Policy</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Security Policy</h1>
        <p className="mt-6 text-base leading-7 text-slate-300">
          Phause designs, operates, and continuously reviews its security controls to protect customer environments, internal systems,
          and confidential data from unauthorized access, misuse, and disruption.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
          <p><strong className="text-white">Control model:</strong> role-based access, least-privilege permissions, approved configuration and operational monitoring.</p>
          <p><strong className="text-white">Operational practices:</strong> automated detection, patching, secure architecture review, and a tested incident response program.</p>
          <p><strong className="text-white">Commitment:</strong> we continually strengthen our detection and protection controls to maintain an enterprise-grade security posture.</p>
        </div>
      </div>
    </main>
  );
}
