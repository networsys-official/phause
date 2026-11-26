import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seo.findFirst({ where: { slug: "terms-of-service", status: "PUBLISHED", deletedAt: null } });
  return { title: seo?.title ?? "Terms of Service", description: seo?.description ?? undefined };
}

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Terms of Service</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mt-6 text-base leading-7 text-slate-300">
          These terms govern access to and use of the Phause platform, services, and support activities. By using our services,
          customers agree to maintain secure account controls, provide timely access to required systems, and use the platform in compliance with applicable law.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
          <p><strong className="text-white">Service expectations:</strong> Phause provides monitoring, security operations, and advisory support according to the agreed scope and service levels.</p>
          <p><strong className="text-white">Customer responsibilities:</strong> maintain security hygiene, provide necessary access, and cooperate with incident response and operational processes.</p>
          <p><strong className="text-white">Limitation of liability:</strong> Phause is not liable for unrelated third-party outages, customer misconfiguration, or unauthorized access caused by user-side security failures.</p>
        </div>
      </div>
    </main>
  );
}
