"use client";

import { useEffect, useState } from "react";

type Tab = "General" | "Hero" | "Trust Bar" | "Plans" | "Comparison Table" | "FAQ" | "Testimonials" | "CTA" | "SEO";

const tabs: Tab[] = ["General", "Hero", "Trust Bar", "Plans", "Comparison Table", "FAQ", "Testimonials", "CTA", "SEO"];

export function SubscriptionCmsEditor({ pageSeo }: { pageSeo?: { title?: string | null; description?: string | null; canonical?: string | null } }) {
  const [tab, setTab] = useState<Tab>("General");
  const [sections, setSections] = useState<Array<Record<string, unknown>>>([]);
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [comparisons, setComparisons] = useState<Array<Record<string, unknown>>>([]);
  const [faqs, setFaqs] = useState<Array<Record<string, unknown>>>([]);
  const [testimonials, setTestimonials] = useState<Array<Record<string, unknown>>>([]);
  const [seo, setSeo] = useState({ title: pageSeo?.title ?? "", description: pageSeo?.description ?? "", canonical: pageSeo?.canonical ?? "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/cms/subscription").then((response) => response.json()).then((payload) => {
      setSections(Array.isArray(payload.sections) ? payload.sections : []);
      setPlans(Array.isArray(payload.plans) ? payload.plans : []);
      setComparisons(Array.isArray(payload.comparisons) ? payload.comparisons : []);
      setFaqs(Array.isArray(payload.faqs) ? payload.faqs : []);
      setTestimonials(Array.isArray(payload.testimonials) ? payload.testimonials : []);
    }).catch(() => setMessage("Unable to load subscription CMS collections."));
  }, []);

  const save = async () => {
    setMessage("");
    const response = await fetch("/api/cms/subscription", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections, plans, comparisons, faqs, testimonials }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Subscription CMS saved successfully." : String(payload.message ?? "Save failed."));
  };

  const input = "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";

  const updateSection = (sectionType: string, key: string, value: unknown) => {
    setSections((items) => {
      const existing = items.find((item) => item.sectionType === sectionType);
      if (!existing) {
        return [...items, { sectionType, enabled: true, sortOrder: items.length, title: "", props: { [key]: value } }];
      }
      return items.map((item) => item.sectionType === sectionType
        ? { ...item, props: { ...(item.props as Record<string, unknown> ?? {}), [key]: value } }
        : item);
    });
  };

  const sectionValue = (sectionType: string, key: string) => {
    const section = sections.find((item) => item.sectionType === sectionType);
    return String((section?.props as Record<string, unknown> | undefined)?.[key] ?? "");
  };

  const sectionItems = (sectionType: string) => {
    const section = sections.find((item) => item.sectionType === sectionType);
    const props = (section?.props ?? {}) as Record<string, unknown>;
    return (props.items ?? []) as Array<Record<string, unknown>>;
  };

  const updateTrustItem = (index: number, key: string, value: unknown) => {
    updateSection("subscriptionFeatures", "items", sectionItems("subscriptionFeatures").map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${tab === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}>{item}</button>
        ))}
      </div>

      {tab === "General" || tab === "SEO" ? (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
          <label className="text-sm text-slate-300">Meta title<input className={input} value={seo.title} onChange={(event) => setSeo((value) => ({ ...value, title: event.target.value }))} /></label>
          <label className="text-sm text-slate-300">Canonical URL<input className={input} value={seo.canonical} onChange={(event) => setSeo((value) => ({ ...value, canonical: event.target.value }))} /></label>
          <label className="text-sm text-slate-300 md:col-span-2">Meta description<textarea className={input} rows={3} value={seo.description} onChange={(event) => setSeo((value) => ({ ...value, description: event.target.value }))} /></label>
        </div>
      ) : null}

      {tab === "Plans" ? (
        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <button type="button" onClick={() => setPlans((items) => [...items, { name: "New Plan", slug: `plan-${items.length + 1}`, description: "", price: "0", billingCycle: "MONTHLY", buttonText: "Choose Plan", buttonUrl: "/registration", active: true, featured: false, sortOrder: items.length, features: [] }])} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Add plan</button>
          {plans.map((plan, planIndex) => (
            <div key={String(plan.id ?? planIndex)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-3">
              {[["name","Plan name"],["slug","Slug"],["price","Price"],["billingCycle","Billing cycle"],["buttonText","Button text"],["buttonUrl","Button URL"],["badge","Badge"],["badgeColor","Badge color"],["cardBackground","Card background"],["borderColor","Border color"],["hoverColor","Hover color"],["icon","Icon"],["image","Image"],["description","Description"]].map(([key, label]) => (
                <label key={key} className="text-xs text-slate-300">{label}<input className={input} value={String(plan[key] ?? "")} onChange={(event) => setPlans((items) => items.map((item, index) => index === planIndex ? { ...item, [key]: event.target.value } : item))} /></label>
              ))}
              <label className="text-xs text-slate-300">Featured<input type="checkbox" className="ml-2" checked={plan.featured === true} onChange={(event) => setPlans((items) => items.map((item, index) => index === planIndex ? { ...item, featured: event.target.checked } : item))} /></label>
              <label className="text-xs text-slate-300">Active<input type="checkbox" className="ml-2" checked={plan.active !== false} onChange={(event) => setPlans((items) => items.map((item, index) => index === planIndex ? { ...item, active: event.target.checked } : item))} /></label>
              <button type="button" onClick={() => setPlans((items) => items.filter((_, index) => index !== planIndex))} className="self-end rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-200">Delete plan</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "FAQ" ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <button type="button" onClick={() => setFaqs((items) => [...items, { question: "New question", answer: "", active: true, sortOrder: items.length }])} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Add FAQ</button>
          {faqs.map((faq, index) => (
            <div key={String(faq.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <input className={input} value={String(faq.question ?? "")} onChange={(event) => setFaqs((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} />
              <textarea className={input} rows={3} value={String(faq.answer ?? "")} onChange={(event) => setFaqs((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} />
              <button type="button" onClick={() => setFaqs((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-start rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-200">Delete</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "Testimonials" ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <button type="button" onClick={() => setTestimonials((items) => [...items, { customerName: "", designation: "", company: "", image: "", review: "", rating: 5, active: true, sortOrder: items.length }])} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Add testimonial</button>
          {testimonials.map((item, index) => (
            <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-2">
              {[["customerName","Customer name"],["designation","Designation"],["company","Company"],["image","Image URL"],["rating","Rating"]].map(([key, label]) => (
                <label key={key} className="text-xs text-slate-300">{label}<input className={input} value={String(item[key] ?? "")} onChange={(event) => setTestimonials((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, [key]: event.target.value } : value))} /></label>
              ))}
              <label className="text-xs text-slate-300 md:col-span-2">Review<textarea className={input} rows={3} value={String(item.review ?? "")} onChange={(event) => setTestimonials((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, review: event.target.value } : value))} /></label>
              <button type="button" onClick={() => setTestimonials((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-start rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-200">Delete</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "Comparison Table" ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <button type="button" onClick={() => setComparisons((items) => [...items, { featureName: "New feature", free: "", starter: "", professional: "", business: "", enterprise: "", active: true, sortOrder: items.length }])} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Add comparison row</button>
          {comparisons.map((item, index) => (
            <div key={String(item.id ?? index)} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-6">
              {["featureName","free","starter","professional","business","enterprise"].map((key) => (
                <input key={key} className={input} placeholder={key} value={String(item[key] ?? "")} onChange={(event) => setComparisons((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, [key]: event.target.value } : value))} />
              ))}
              <button type="button" onClick={() => setComparisons((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200 md:col-span-6">Delete row</button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "Hero" ? (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
          {[["badgeText","Badge text"],["eyebrow","Badge fallback"],["title","Main title"],["highlightedWord","Highlighted word"],["subtitle","Subtitle"],["backgroundImage","Background image URL"],["ctaText","CTA text"],["ctaUrl","CTA URL"]].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-300">{label}<input className={input} value={sectionValue("hero", key)} onChange={(event) => updateSection("hero", key, event.target.value)} /></label>
          ))}
        </div>
      ) : null}

      {tab === "Trust Bar" ? (
        <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <button type="button" onClick={() => updateSection("subscriptionFeatures", "items", [...sectionItems("subscriptionFeatures"), { icon: "badge", title: "New trust item", description: "", displayOrder: sectionItems("subscriptionFeatures").length }])} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Add trust item</button>
          {sectionItems("subscriptionFeatures").map((item, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-3">
              <input className={input} placeholder="Icon" value={String(item.icon ?? "")} onChange={(event) => updateTrustItem(index, "icon", event.target.value)} />
              <input className={input} placeholder="Title" value={String(item.title ?? "")} onChange={(event) => updateTrustItem(index, "title", event.target.value)} />
              <input className={input} placeholder="Description" value={String(item.description ?? "")} onChange={(event) => updateTrustItem(index, "description", event.target.value)} />
            </div>
          ))}
        </div>
      ) : null}

      {tab === "CTA" ? (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
          {[["heading","Headline"],["description","Description"],["buttonText","Button text"],["buttonLink","Button URL"],["backgroundImage","Background image URL"]].map(([key, label]) => (
            <label key={key} className="text-sm text-slate-300">{label}<input className={input} value={sectionValue("subscriptionCta", key)} onChange={(event) => updateSection("subscriptionCta", key, event.target.value)} /></label>
          ))}
        </div>
      ) : null}

      {!(["Plans", "FAQ", "Testimonials", "Comparison Table"] as Tab[]).includes(tab) && tab !== "General" && tab !== "SEO" ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-sm text-slate-300">
          Edit this section from the page section blocks below. Select the matching section in the page builder and update its title, description, items, image, button text, and button URL.
        </div>
      ) : null}

      <button type="button" onClick={() => void save()} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Save subscription CMS</button>
      {message ? <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}
