"use client";

import { useEffect, useState } from "react";

type Tab = "SEO" | "Hero" | "Trust Bar" | "Pricing" | "Plans" | "Comparison Table" | "FAQ" | "Testimonials" | "CTA";
const tabs: Tab[] = ["SEO", "Hero", "Trust Bar", "Pricing", "Plans", "Comparison Table", "FAQ", "Testimonials", "CTA"];
const input = "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";

type Row = Record<string, unknown>;

export function SubscriptionCmsEditorV2() {
  const [tab, setTab] = useState<Tab>("SEO");
  const [data, setData] = useState<Row | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/cms/subscription-page", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setData(payload.success ? payload : null))
      .catch(() => setMessage("Unable to load subscription CMS."));
  }, []);

  if (!data) return <div className="rounded-3xl border border-white/10 p-6 text-sm text-slate-300">Subscription CMS loading.</div>;

  const setRecord = (key: string, value: Row) => setData((current) => ({ ...(current ?? {}), [key]: value }));
  const setRows = (key: string, rows: Row[]) => setData((current) => ({ ...(current ?? {}), [key]: rows }));
  const record = (key: string) => (data[key] ?? {}) as Row;
  const rows = (key: string) => (data[key] ?? []) as Row[];
  const update = (key: string, field: string, value: unknown) => setRecord(key, { ...record(key), [field]: value });

  const move = (key: string, index: number, direction: -1 | 1) => {
    const list = [...rows(key)];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setRows(key, list.map((item, sortOrder) => ({ ...item, sortOrder })));
  };

  const save = async () => {
    setMessage("");
    const response = await fetch("/api/cms/subscription-page", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const payload = await response.json();
    setMessage(response.ok ? "Subscription CMS saved successfully." : String(payload.message ?? "Save failed."));
  };

  const reorder = (key: string, index: number) => (
    <div className="flex gap-2">
      <button type="button" className="rounded-lg border border-white/10 px-2 py-1 text-xs" onClick={() => move(key, index, -1)}>Up</button>
      <button type="button" className="rounded-lg border border-white/10 px-2 py-1 text-xs" onClick={() => move(key, index, 1)}>Down</button>
    </div>
  );

  const textField = (key: string, field: string, label: string) => (
    <label key={`${key}-${field}`} className="text-sm text-slate-300">{label}<input className={input} value={String(record(key)[field] ?? "")} onChange={(event) => update(key, field, event.target.value)} /></label>
  );

  const sectionOrder = ((record("page").sectionOrder ?? ["hero", "trust", "pricing", "comparison", "faq", "testimonials", "cta"] ) as string[]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3">
        {tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${tab === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}>{item}</button>)}
      </div>

      {tab === "SEO" && <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {textField("page", "title", "Page title")}{textField("page", "metaTitle", "Meta title")}{textField("page", "ogImage", "OG image")}
        <label className="text-sm text-slate-300 md:col-span-2">Meta description<textarea className={input} rows={3} value={String(record("page").metaDescription ?? "")} onChange={(event) => update("page", "metaDescription", event.target.value)} /></label>
        <label className="text-sm text-slate-300">Active<input type="checkbox" className="ml-2" checked={record("page").active !== false} onChange={(event) => update("page", "active", event.target.checked)} /></label>
        <div className="md:col-span-2 space-y-2"><p className="text-sm text-slate-300">Section order</p>{sectionOrder.map((section, index) => <div key={section} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm"><span>{section}</span><div className="flex gap-2"><button type="button" className="rounded-lg border border-white/10 px-2 py-1" onClick={() => { const next = [...sectionOrder]; [next[index], next[index - 1]] = [next[index - 1], next[index]]; update("page", "sectionOrder", next.filter(Boolean)); }} disabled={index === 0}>Up</button><button type="button" className="rounded-lg border border-white/10 px-2 py-1" onClick={() => { const next = [...sectionOrder]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; update("page", "sectionOrder", next.filter(Boolean)); }} disabled={index === sectionOrder.length - 1}>Down</button></div></div>)}</div>
      </div>}

      {tab === "Hero" && <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {[ ["badgeText","Badge text"], ["badgeIcon","Badge icon"], ["heading","Heading"], ["highlightedWord","Highlighted word"], ["subtitle","Subtitle"], ["backgroundImage","Background image"], ["ctaPrimaryText","Primary button text"], ["ctaPrimaryUrl","Primary button URL"], ["ctaSecondaryText","Secondary button text"], ["ctaSecondaryUrl","Secondary button URL"], ["accentColor","Accent color"], ["overlayColor","Overlay color"] ].map(([field,label]) => textField("hero", field, label))}
        <label className="text-sm text-slate-300">Badge visible<input type="checkbox" className="ml-2" checked={record("hero").badgeVisible !== false} onChange={(event) => update("hero", "badgeVisible", event.target.checked)} /></label>
        <label className="text-sm text-slate-300">Section visible<input type="checkbox" className="ml-2" checked={record("hero").visible !== false} onChange={(event) => update("hero", "visible", event.target.checked)} /></label>
      </div>}

      {tab === "Trust Bar" && <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setRows("trustItems", [...rows("trustItems"), { icon:"badge", title:"", description:"", visible:true, sortOrder:rows("trustItems").length }])}>Add trust item</button>
        {rows("trustItems").map((item, index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-5">
          {[ ["icon","Icon"], ["title","Title"], ["description","Description"] ].map(([field,label]) => <label key={field} className="text-xs text-slate-300">{label}<input className={input} value={String(item[field] ?? "")} onChange={(event) => setRows("trustItems", rows("trustItems").map((value, i) => i === index ? { ...value, [field]:event.target.value } : value))} /></label>)}
          <label className="text-xs text-slate-300">Visible<input type="checkbox" className="ml-2" checked={item.visible !== false} onChange={(event) => setRows("trustItems", rows("trustItems").map((value, i) => i === index ? { ...value, visible:event.target.checked } : value))} /></label>
          <div className="flex gap-2">{reorder("trustItems", index)}<button type="button" className="text-xs text-red-300" onClick={() => setRows("trustItems", rows("trustItems").filter((_, i) => i !== index))}>Delete</button></div>
        </div>)}
      </div>}

      {tab === "Pricing" && <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {textField("pricing", "title", "Heading")}{textField("pricing", "subtitle", "Subtitle")}{textField("pricing", "badgeText", "Badge text")}{textField("pricing", "accentColor", "Accent color")}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={record("pricing").visible !== false} onChange={(event) => update("pricing", "visible", event.target.checked)} /></label>
      </div>}

      {tab === "Plans" && <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setRows("plans", [...rows("plans"), { name:"", badge:"", description:"", price:"0", yearlyPrice:"0", billingCycle:"MONTHLY", buttonText:"", buttonUrl:"/registration", popular:false, active:true, sortOrder:rows("plans").length, icon:"shield", accent:"cyan", features:[] }])}>Add plan</button>
        {rows("plans").map((plan, index) => {
          const features = (plan.features ?? []) as Row[];
          return <div key={String(plan.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-3">
            {[ ["name","Name"],["badge","Badge"],["description","Description"],["price","Price"],["yearlyPrice","Yearly price"],["billingCycle","Billing cycle"],["buttonText","Button text"],["buttonUrl","Button URL"],["icon","Icon"],["accent","Accent"],["cardBackground","Card background"],["badgeColor","Badge color"],["borderColor","Border color"] ].map(([field,label]) => <label key={field} className="text-xs text-slate-300">{label}<input className={input} value={String(plan[field] ?? "")} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, [field]:event.target.value } : value))} /></label>)}
            <label className="text-xs text-slate-300">Popular<input className="ml-2" type="checkbox" checked={plan.popular === true} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, popular:event.target.checked } : value))} /></label>
            <label className="text-xs text-slate-300">Active<input className="ml-2" type="checkbox" checked={plan.active !== false} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, active:event.target.checked } : value))} /></label>
            <div className="md:col-span-3 space-y-2"><button type="button" className="rounded-lg border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-200" onClick={() => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, features:[...features,{ text:"", icon:"check", visible:true, sortOrder:features.length }] } : value))}>Add feature</button>
              {features.map((feature, featureIndex) => <div key={String(feature.id ?? featureIndex)} className="grid gap-2 md:grid-cols-4"><input className={input} value={String(feature.text ?? "")} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, features:features.map((item, j) => j === featureIndex ? { ...item, text:event.target.value } : item) } : value))} /><input className={input} value={String(feature.icon ?? "")} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, features:features.map((item, j) => j === featureIndex ? { ...item, icon:event.target.value } : item) } : value))} /><label className="text-xs text-slate-300">Visible<input className="ml-2" type="checkbox" checked={feature.visible !== false} onChange={(event) => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, features:features.map((item, j) => j === featureIndex ? { ...item, visible:event.target.checked } : item) } : value))} /></label><button type="button" className="text-xs text-red-300" onClick={() => setRows("plans", rows("plans").map((value, i) => i === index ? { ...value, features:features.filter((_, j) => j !== featureIndex) } : value))}>Delete feature</button></div>)}
            </div>
            <div className="md:col-span-3 flex items-center justify-between">{reorder("plans", index)}<button type="button" className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200" onClick={() => setRows("plans", rows("plans").filter((_, i) => i !== index))}>Delete plan</button></div>
          </div>;
        })}
      </div>}

      {tab === "Comparison Table" && <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        {textField("comparison", "title", "Heading")}{textField("comparison", "subtitle", "Subtitle")}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={record("comparison").visible !== false} onChange={(event) => update("comparison", "visible", event.target.checked)} /></label>
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setRows("comparisonRows", [...rows("comparisonRows"), { name:"", freeValue:"", starterValue:"", professionalValue:"", businessValue:"", enterpriseValue:"", sortOrder:rows("comparisonRows").length, active:true }])}>Add row</button>
        {rows("comparisonRows").map((row, index) => <div key={String(row.id ?? index)} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-7">
          {["name","freeValue","starterValue","professionalValue","businessValue","enterpriseValue"].map((field) => <input key={field} className={input} placeholder={field} value={String(row[field] ?? "")} onChange={(event) => setRows("comparisonRows", rows("comparisonRows").map((value, i) => i === index ? { ...value, [field]:event.target.value } : value))} />)}
          <div className="flex items-center gap-2">{reorder("comparisonRows", index)}<button type="button" className="text-xs text-red-300" onClick={() => setRows("comparisonRows", rows("comparisonRows").filter((_, i) => i !== index))}>Delete</button></div>
        </div>)}
      </div>}

      {tab === "FAQ" && <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        {textField("faq", "title", "Heading")}{textField("faq", "subtitle", "Subtitle")}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={record("faq").visible !== false} onChange={(event) => update("faq", "visible", event.target.checked)} /></label>
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setRows("faqs", [...rows("faqs"), { question:"", answer:"", sortOrder:rows("faqs").length, active:true }])}>Add FAQ</button>
        {rows("faqs").map((item, index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4"><input className={input} placeholder="Question" value={String(item.question ?? "")} onChange={(event) => setRows("faqs", rows("faqs").map((value, i) => i === index ? { ...value, question:event.target.value } : value))} /><textarea className={input} rows={3} placeholder="Answer" value={String(item.answer ?? "")} onChange={(event) => setRows("faqs", rows("faqs").map((value, i) => i === index ? { ...value, answer:event.target.value } : value))} /><div className="flex justify-between">{reorder("faqs", index)}<label className="text-xs text-slate-300">Active<input className="ml-2" type="checkbox" checked={item.active !== false} onChange={(event) => setRows("faqs", rows("faqs").map((value, i) => i === index ? { ...value, active:event.target.checked } : value))} /></label><button type="button" className="text-xs text-red-300" onClick={() => setRows("faqs", rows("faqs").filter((_, i) => i !== index))}>Delete</button></div></div>)}
      </div>}

      {tab === "Testimonials" && <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        {textField("testimonials", "title", "Heading")}{textField("testimonials", "subtitle", "Subtitle")}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={record("testimonials").visible !== false} onChange={(event) => update("testimonials", "visible", event.target.checked)} /></label>
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setRows("testimonialItems", [...rows("testimonialItems"), { name:"", company:"", designation:"", image:"", rating:5, review:"", active:true, sortOrder:rows("testimonialItems").length }])}>Add testimonial</button>
        {rows("testimonialItems").map((item, index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-2">
          {[ ["name","Name"], ["company","Company"], ["designation","Designation"], ["image","Image URL"], ["rating","Rating"] ].map(([field,label]) => <label key={field} className="text-xs text-slate-300">{label}<input className={input} value={String(item[field] ?? "")} onChange={(event) => setRows("testimonialItems", rows("testimonialItems").map((value, i) => i === index ? { ...value, [field]:event.target.value } : value))} /></label>) }
          <label className="text-xs text-slate-300 md:col-span-2">Review<textarea className={input} rows={3} value={String(item.review ?? "")} onChange={(event) => setRows("testimonialItems", rows("testimonialItems").map((value, i) => i === index ? { ...value, review:event.target.value } : value))} /></label>
          <div className="flex justify-between">{reorder("testimonialItems", index)}<button type="button" className="text-xs text-red-300" onClick={() => setRows("testimonialItems", rows("testimonialItems").filter((_, i) => i !== index))}>Delete</button></div>
        </div>)}
      </div>}

      {tab === "CTA" && <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {textField("cta", "title", "Title")}{textField("cta", "description", "Description")}{textField("cta", "buttonText", "Button text")}{textField("cta", "buttonUrl", "Button URL")}{textField("cta", "backgroundImage", "Background image")}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={record("cta").visible !== false} onChange={(event) => update("cta", "visible", event.target.checked)} /></label>
      </div>}

      <button type="button" onClick={() => void save()} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Save subscription CMS</button>
      {message && <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{message}</div>}
    </div>
  );
}
