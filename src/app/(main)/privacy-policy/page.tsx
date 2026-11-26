import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seo.findFirst({ where: { slug: "privacy-policy", status: "PUBLISHED", deletedAt: null } });
  return { title: seo?.title ?? "Privacy Policy", description: seo?.description ?? undefined };
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Privacy Policy</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-6 text-base leading-7 text-slate-300">
          Phause collects only the information required to deliver, secure, and support our platform and services.
          We use personal data to provide account access, secure infrastructure monitoring, and support communications.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-300">
          <p><strong className="text-white">Data we process:</strong> contact information, account details, service usage records, and operational security data necessary to protect your environment.</p>
          <p><strong className="text-white">How we use it:</strong> to deliver services, maintain security, respond to incidents, comply with legal obligations, and improve platform reliability.</p>
          <p><strong className="text-white">Your rights:</strong> you may request access, correction, deletion, or export of your personal data, subject to legal requirements and security constraints.</p>
        </div>
      </div>
    </main>
  );
}
