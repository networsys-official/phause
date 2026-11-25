import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/database/prisma";

async function loadPage() {
  return prisma.page.findFirst({ where: { slug: "how-it-works", status: "PUBLISHED", deletedAt: null }, include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } } });
}
export async function generateMetadata(): Promise<Metadata> { const page = await loadPage(); return { title: page?.seo?.title ?? "How It Works", description: page?.seo?.description ?? undefined }; }

function cmsText(node: unknown, out: string[] = []): string[] { if (typeof node === "string") { if (node.trim()) out.push(node.trim()); } else if (Array.isArray(node)) node.forEach((item) => cmsText(item, out)); else if (node && typeof node === "object") Object.values(node).forEach((item) => cmsText(item, out)); return out; }

export default async function HowItWorksPage() {
  const page = await loadPage();
  if (!page) notFound();
  const blocks = page.blocks.map((block) => ({ type: block.type, props: block.props as Record<string, unknown> }));
  const compact = (value: string) => value.replace(/[^a-z]/gi, "").toLowerCase();
  const hero = (blocks.find((block) => compact(block.type) === "hero")?.props ?? {}) as Record<string, unknown>;
  const features = blocks.flatMap((block) => Array.isArray(block.props.items) ? block.props.items as unknown[] : []);
  const cta = (blocks.find((block) => compact(block.type) === "cta")?.props ?? {}) as Record<string, unknown>;
  const value = (item: unknown, fallback = "") => typeof item === "string" ? item : fallback;
  return (
    <main className="overflow-hidden bg-[#081522] text-white">
      <div className="sr-only">{cmsText(blocks.map((block) => block.props)).join(" ")}</div>
      <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          {value(hero.eyebrow) ? <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-cyan-400">{value(hero.eyebrow)}</p> : null}
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{value(hero.title)}</h1>
          {value(hero.description) ? <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">{value(hero.description)}</p> : null}
        </div>
      </section>
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((raw, index) => {
              const item = raw as Record<string, unknown>;
              const workflows = Array.isArray(item.workflows) ? item.workflows : [];
              const checklist = Array.isArray(item.checklist) ? item.checklist : [];
              return (
                <article key={index} className="rounded-2xl border border-white/10 bg-[#101f2e] p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 text-sm font-bold text-cyan-300">{index + 1}</div>
                  {value(item.title) ? <h2 className="text-xl font-bold">{value(item.title)}</h2> : null}
                  {value(item.headline) ? <p className="mt-3 text-sm font-semibold text-cyan-200">{value(item.headline)}</p> : null}
                  {value(item.description) ? <p className="mt-3 leading-7 text-slate-300">{value(item.description)}</p> : null}
                  {value(item.whyItMatters) ? <p className="mt-4 text-sm text-cyan-200"><strong>Why it matters:</strong> {value(item.whyItMatters)}</p> : null}
                  {value(item.interpretationNote) ? <p className="mt-3 text-sm text-amber-200">{value(item.interpretationNote)}</p> : null}
                  {value(item.outcome) ? <p className="mt-3 text-sm text-emerald-200"><strong>Outcome:</strong> {value(item.outcome)}</p> : null}
                  {value(item.workflowsHeading) ? <p className="mt-5 text-xs font-bold uppercase tracking-wider text-cyan-300">{value(item.workflowsHeading)}</p> : null}
                  {workflows.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">{workflows.map((workflow, workflowIndex) => <li key={workflowIndex}>{String(workflow)}</li>)}</ul> : null}
                  {checklist.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">{checklist.map((check, checkIndex) => <li key={checkIndex}>{String(check)}</li>)}</ul> : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      {value(cta.title) ? (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-slate-900 p-8 md:p-12">
              <h2 className="text-3xl font-black md:text-5xl">{value(cta.title)}</h2>
              {value(cta.description) ? <p className="mt-4 max-w-3xl leading-8 text-slate-300">{value(cta.description)}</p> : null}
              <div className="mt-8 flex flex-wrap gap-4">
                {value(cta.label) ? <Link href={value(cta.href, "/contact")} className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950">{value(cta.label)}</Link> : null}
                {value(cta.secondaryLabel) ? <Link href={value(cta.secondaryHref, "/contact")} className="rounded-full border border-cyan-400/40 px-6 py-3 font-semibold text-cyan-200">{value(cta.secondaryLabel)}</Link> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
