"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, Check, Globe, Headset, Landmark, Lock, Rocket, Shield, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

interface SubscriptionPlanRecord {
  id: string; name: string; badge: string | null; description: string; price: string;
  yearlyPrice: string | null; billingCycle: string; buttonText: string; buttonUrl: string; popular: boolean;
  active: boolean; sortOrder: number; icon: string; accent: string; cardBackground: string | null;
  badgeColor: string | null; borderColor: string | null;
  features: Array<{ id: string; text: string; icon: string | null; visible: boolean; sortOrder: number }>;
}

interface SubscriptionPayload {
  page: { title: string; slug: string; metaTitle: string | null; metaDescription: string | null; ogImage: string | null; active: boolean; sectionOrder: string[] } | null;
  hero: Record<string, unknown> | null;
  trustItems: Array<Record<string, unknown>>;
  pricing: Record<string, unknown> | null;
  plans: SubscriptionPlanRecord[];
  comparison: Record<string, unknown> | null;
  comparisonRows: Array<Record<string, unknown>>;
  faq: Record<string, unknown> | null;
  faqs: Array<Record<string, unknown>>;
  testimonials: Record<string, unknown> | null;
  testimonialItems: Array<Record<string, unknown>>;
  cta: Record<string, unknown> | null;
}

const iconLookup = {
  badge: BadgeCheck, lock: Lock, globe: Globe, headset: Headset, trend: TrendingUp,
  shield: Shield, shieldcheck: ShieldCheck, rocket: Rocket, building: Building2, landmark: Landmark,
  sparkles: Sparkles,
};

function CMSIcon({ name, className = "w-5 h-5" }: { name?: unknown; className?: string }) {
  const Icon = iconLookup[String(name ?? "badge").toLowerCase() as keyof typeof iconLookup] ?? BadgeCheck;
  return <Icon className={className} />;
}

function headingHighlight(heading: unknown, highlighted: unknown) {
  const title = String(heading ?? "");
  const word = String(highlighted ?? "");
  if (!word || !title.includes(word)) return title;
  const parts = title.split(word);
  return <>{parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 ? <span className="text-gradient">{word}</span> : null}</span>)}</>;
}

export function SubscriptionCmsPage() {
  const [payload, setPayload] = useState<SubscriptionPayload | null>(null);

  useEffect(() => {
    void fetch("/api/cms/subscription-page", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setPayload(data.success ? data : null))
      .catch(() => setPayload(null));
  }, []);

  if (!payload || !payload.page?.active) return null;

  const hero = payload.hero;
  const trustItems = payload.trustItems ?? [];
  const pricing = payload.pricing;
  const plans = payload.plans ?? [];
  const comparison = payload.comparison;
  const faq = payload.faq;
  const testimonials = payload.testimonials;
  const cta = payload.cta;
  const sectionOrder = Array.isArray(payload.page.sectionOrder) ? payload.page.sectionOrder : ["hero", "trust", "pricing", "comparison", "faq", "testimonials", "cta"];

  const sections: Record<string, React.ReactNode> = {
    hero: hero?.visible ? (
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden pt-24" style={hero.backgroundImage ? { backgroundImage: `linear-gradient(rgba(5,9,15,.72), rgba(5,9,15,.92)), url(${String(hero.backgroundImage)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "linear-gradient(rgba(0,216,201,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,216,201,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {hero.badgeVisible ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-sm text-phause-cyan mb-8"><CMSIcon name={hero.badgeIcon} />{String(hero.badgeText ?? "")}</motion.div> : null}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-black leading-[1.05] mb-6">{headingHighlight(hero.heading, hero.highlightedWord)}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">{String(hero.subtitle ?? "")}</motion.p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {hero.ctaPrimaryText ? <Link href={String(hero.ctaPrimaryUrl ?? "#")} className="px-7 py-3 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark font-bold">{String(hero.ctaPrimaryText)}</Link> : null}
            {hero.ctaSecondaryText ? <Link href={String(hero.ctaSecondaryUrl ?? "#")} className="px-7 py-3 rounded-full border border-phause-cyan/30 text-phause-cyan font-bold">{String(hero.ctaSecondaryText)}</Link> : null}
          </div>
        </div>
      </section>
    ) : null,
    trust: trustItems.length ? (
      <section className="relative py-10 border-y border-phause-border/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {trustItems.map((item) => <div key={String(item.id)} className="flex items-center gap-2.5 text-slate-400"><CMSIcon name={item.icon} className="w-5 h-5 text-phause-cyan" /><div><span className="text-sm font-medium">{String(item.title ?? "")}</span>{item.description ? <p className="text-xs text-slate-500">{String(item.description)}</p> : null}</div></div>)}
        </div>
      </section>
    ) : null,
    pricing: pricing?.visible ? (
      <section id="pricing" className="relative py-28">
        <div className="text-center max-w-3xl mx-auto mb-16 px-6">
          {pricing.badgeText ? <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-phause-cyan/10 text-phause-cyan border border-phause-cyan/20 mb-4">{String(pricing.badgeText)}</span> : null}
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">{String(pricing.title ?? "")}</h2>
          {pricing.subtitle ? <p className="text-slate-400 text-lg">{String(pricing.subtitle)}</p> : null}
        </div>
        <div className="max-w-7xl mx-auto px-6 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article key={plan.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} style={plan.cardBackground ? { background: plan.cardBackground } : undefined} className={`relative glass rounded-3xl p-8 flex flex-col overflow-hidden ${plan.popular ? "border-phause-cyan/50 shadow-[0_0_50px_rgba(0,216,201,0.15)]" : ""}`}>
              {plan.badge ? <div className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-2xl text-xs font-black uppercase" style={{ background: plan.badgeColor ?? undefined }}>{plan.badge}</div> : null}
              <div className="flex items-center gap-3 mt-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-phause-cyan/15 flex items-center justify-center"><CMSIcon name={plan.icon} className="w-6 h-6 text-phause-cyan" /></div><div><h3 className="text-xl font-extrabold">{plan.name}</h3></div></div>
              <p className="text-sm text-slate-400 mb-6 min-h-[60px]">{plan.description}</p>
              <div className="mb-6"><span className="text-5xl font-black text-gradient">{plan.price}</span></div>
              <ul className="space-y-3 mb-8 flex-1">{plan.features.map((feature) => <li key={feature.id} className="flex items-start gap-3 text-sm text-slate-300"><Check className="w-4 h-4 text-phause-cyan mt-0.5 shrink-0" /><span>{feature.text}</span></li>)}</ul>
              <Link href={plan.buttonUrl} className="mt-auto block text-center py-3 rounded-xl bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark font-bold">{plan.buttonText}</Link>
            </motion.article>
          ))}
        </div>
      </section>
    ) : null,
    comparison: comparison?.visible ? (
      <section className="relative py-28">
        <div className="text-center max-w-3xl mx-auto mb-16 px-6"><h2 className="text-3xl md:text-5xl font-extrabold mb-4">{String(comparison.title ?? "")}</h2>{comparison.subtitle ? <p className="text-slate-400 text-lg">{String(comparison.subtitle)}</p> : null}</div>
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-phause-border"><th className="py-4 px-5" /><th className="py-4 px-5 text-center">{plans[0]?.name ?? ""}</th><th className="py-4 px-5 text-center">{plans[1]?.name ?? ""}</th><th className="py-4 px-5 text-center">{plans[2]?.name ?? ""}</th><th className="py-4 px-5 text-center">{plans[3]?.name ?? ""}</th><th className="py-4 px-5 text-center">{plans[4]?.name ?? ""}</th></tr></thead><tbody>{payload.comparisonRows.map((row) => <tr key={String(row.id)} className="border-b border-phause-border/40"><td className="py-4 px-5 text-sm font-semibold">{String(row.name)}</td>{[row.freeValue, row.starterValue, row.professionalValue, row.businessValue, row.enterpriseValue].map((value, index) => <td key={index} className="py-4 px-5 text-center text-sm text-slate-300">{String(value ?? "")}</td>)}</tr>)}</tbody></table></div>
      </section>
    ) : null,
    faq: faq?.visible ? (
      <section className="relative py-28"><div className="text-center max-w-3xl mx-auto mb-16 px-6"><h2 className="text-3xl md:text-5xl font-extrabold mb-4">{String(faq.title ?? "")}</h2>{faq.subtitle ? <p className="text-slate-400 text-lg">{String(faq.subtitle)}</p> : null}</div><div className="max-w-3xl mx-auto px-6 space-y-4">{payload.faqs.map((item) => <details key={String(item.id)} className="glass rounded-2xl p-6"><summary className="cursor-pointer font-bold">{String(item.question)}</summary><p className="mt-4 text-slate-400">{String(item.answer)}</p></details>)}</div></section>
    ) : null,
    testimonials: testimonials?.visible ? (
      <section className="py-28"><div className="text-center max-w-3xl mx-auto mb-16 px-6"><h2 className="text-3xl md:text-5xl font-extrabold mb-4">{String(testimonials.title ?? "")}</h2>{testimonials.subtitle ? <p className="text-slate-400 text-lg">{String(testimonials.subtitle)}</p> : null}</div><div className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-3">{payload.testimonialItems.map((item) => <article key={String(item.id)} className="glass rounded-3xl p-7"><p className="text-slate-300 mb-6">{String(item.review)}</p><div className="flex items-center gap-3">{item.image ? <img src={String(item.image)} alt="" className="w-12 h-12 rounded-full object-cover" /> : null}<div><p className="font-bold">{String(item.name)}</p><p className="text-xs text-slate-400">{[item.designation, item.company].filter(Boolean).map(String).join(" · ")}</p></div></div></article>)}</div></section>
    ) : null,
    cta: cta?.visible ? (
      <section className="relative py-28 px-6"><div className="max-w-5xl mx-auto rounded-3xl border border-phause-cyan/20 p-10 md:p-16 text-center overflow-hidden" style={cta.backgroundImage ? { backgroundImage: `linear-gradient(rgba(5,9,15,.88), rgba(5,9,15,.88)), url(${String(cta.backgroundImage)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}><h2 className="text-3xl md:text-5xl font-black mb-5">{String(cta.title ?? "")}</h2>{cta.description ? <p className="text-slate-400 max-w-2xl mx-auto mb-8">{String(cta.description)}</p> : null}<Link href={String(cta.buttonUrl ?? "#")} className="inline-flex px-8 py-4 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark font-bold">{String(cta.buttonText ?? "")}</Link></div></section>
    ) : null,
  };

  return <main>{sectionOrder.map((key) => <div key={key}>{sections[key]}</div>)}</main>;
}
