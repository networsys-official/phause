"use client";

import { useEffect, useState } from "react";

type Tab = "SEO" | "Hero" | "Trust Bar" | "Pricing" | "Plans" | "Comparison Table" | "FAQ" | "Testimonials" | "CTA";
const tabs: Tab[] = ["SEO", "Hero", "Trust Bar", "Pricing", "Plans", "Comparison Table", "FAQ", "Testimonials", "CTA"];

type RecordValue = Record<string, unknown>;

const inputClass = "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";

function moveItem(items: RecordValue[], index: number, direction: -1 | 1) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((item, sortOrder) => ({ ...item, sortOrder }));
}

export { SubscriptionCmsEditorV2 as SubscriptionDatabaseCmsEditor } from "./subscription-cms-editor-v2";

/*
export function SubscriptionDatabaseCmsEditor() {
  const [tab, setTab] = useState<Tab>("SEO");
  const [payload, setPayload] = useState<RecordValue | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/cms/subscription-page", { cache: "no-store" }).then((response) => response.json()).then((data) => setPayload(data.success ? data : null)).catch(() => setMessage("Unable to load subscription CMS."));
  }, []);

  if (!payload) return <div className="rounded-3xl border border-white/10 p-6 text-sm text-slate-300">Subscription CMS

  const page = (payload.page ?? {}) as RecordValue;
  const hero = (payload.hero ?? {}) as RecordValue;
  const pricing = (payload.pricing ?? {}) as RecordValue;
  const comparison = (payload.comparison ?? {}) as RecordValue;
  const faq = (payload.faq ?? {}) as RecordValue;
  const testimonials = (payload.testimonials ?? {}) as RecordValue;
  const cta = (payload.cta ?? {}) as RecordValue;
  const trustItems = (payload.trustItems ?? []) as RecordValue[];
  const plans = (payload.plans ?? []) as RecordValue[];
  const comparisonRows = (payload.comparisonRows ?? []) as RecordValue[];
  const faqs = (payload.faqs ?? []) as RecordValue[];
  const testimonialItems = (payload.testimonialItems ?? []) as RecordValue[];

  const setRecord = (key: string, value: RecordValue) => setPayload((current) => ({ ...(current ?? {}), [key]: value }));
  const setArray = (key: string, value: RecordValue[]) => setPayload((current) => ({ ...(current ?? {}), [key]: value }));

  const updateRecord = (key: string, field: string, value: unknown) => {
    const current = (payload[key] ?? {}) as RecordValue;
    setRecord(key, { ...current, [field]: value });
  };

  const uploadImage = async (file: File, targetKey: string, targetField: string) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result ?? "");
      await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: file.name, filename: file.name, mimeType: file.type, url, altText: file.name }) });
      updateRecord(targetKey, targetField, url);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setMessage("");
    const response = await fetch("/api/cms/subscription-page", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setMessage(response.ok ? "Subscription CMS saved successfully." : String(data.message ?? "Save failed."));
  };

  const ImageField = ({ label, value, targetKey, targetField }: { label: string; value: unknown; targetKey: string; targetField: string }) => (
    <label className="text-xs text-slate-300">{label}<input className={inputClass} value={String(value ?? "")} onChange={(event) => updateRecord(targetKey, targetField, event.target.value)} /><input className="mt-2 block w-full text-xs text-slate-400" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file, targetKey, targetField); }} /></label>
  );

  const reorderButtons = (items: RecordValue[], setItems: (items: RecordValue[]) => void, index: number) => (
    <div className="flex gap-2"><button type="button" className="rounded-lg border border-white/10 px-2 py-1 text-xs" onClick={() => setItems(moveItem(items, index, -1))}>Up</button><button type="button" className="rounded-lg border border-white/10 px-2 py-1 text-xs" onClick={() => setItems(moveItem(items, index, 1))}>Down</button></div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3">{tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${tab === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}>{item}</button>)}</div>

      {tab === "SEO" ? <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {[ ["title","Page title"],["metaTitle","Meta title"],["metaDescription","Meta description"],["ogImage","OG image"] ].map(([field,label]) => <label key={field} className="text-sm text-slate-300">{label}{field === "metaDescription" ? <textarea className={inputClass} rows={3} value={String(page[field] ?? "")} onChange={(event) => updateRecord("page",field,event.target.value)} /> : <input className={inputClass} value={String(page[field] ?? "")} onChange={(event) => updateRecord("page",field,event.target.value)} />}</label>)}
        <label className="text-sm text-slate-300">Active<input type="checkbox" className="ml-2" checked={page.active !== false} onChange={(event) => updateRecord("page","active",event.target.checked)} /></label>
      </div> : null}

      {tab === "Hero" ? <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {[ ["badgeText","Badge text"],["badgeIcon","Badge icon"],["heading","Heading"],["highlightedWord","Highlighted word"],["subtitle","Subtitle"],["ctaPrimaryText","Primary button text"],["ctaPrimaryUrl","Primary button URL"],["ctaSecondaryText","Secondary button text"],["ctaSecondaryUrl","Secondary button URL"],["accentColor","Accent color"],["overlayColor","Overlay color"] ].map(([field,label]) => <label key={field} className="text-sm text-slate-300">{label}<input className={inputClass} value={String(hero[field] ?? "")} onChange={(event) => updateRecord("hero",field,event.target.value)} /></label>)}
        <ImageField label="Background image" value={hero.backgroundImage} targetKey="hero" targetField="backgroundImage" />
        <label className="text-sm text-slate-300">Badge visible<input type="checkbox" className="ml-2" checked={hero.badgeVisible !== false} onChange={(event) => updateRecord("hero","badgeVisible",event.target.checked)} /></label>
        <label className="text-sm text-slate-300">Section visible<input type="checkbox" className="ml-2" checked={hero.visible !== false} onChange={(event) => updateRecord("hero","visible",event.target.checked)} /></label>
      </div> : null}

      {tab === "Trust Bar" ? <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setArray("trustItems", [...trustItems, { icon: "badge", title: "", description: "", visible: true, sortOrder: trustItems.length }])}>Add trust item</button>
        {trustItems.map((item,index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-5"><input className={inputClass} placeholder="Icon" value={String(item.icon ?? "")} onChange={(event) => setArray("trustItems",trustItems.map((value,i) => i === index ? {...value,icon:event.target.value} : value))} /><input className={inputClass} placeholder="Title" value={String(item.title ?? "")} onChange={(event) => setArray("trustItems",trustItems.map((value,i) => i === index ? {...value,title:event.target.value} : value))} /><input className={inputClass} placeholder="Description" value={String(item.description ?? "")} onChange={(event) => setArray("trustItems",trustItems.map((value,i) => i === index ? {...value,description:event.target.value} : value))} /><label className="text-xs text-slate-300">Visible<input type="checkbox" className="ml-2" checked={item.visible !== false} onChange={(event) => setArray("trustItems",trustItems.map((value,i) => i === index ? {...value,visible:event.target.checked} : value))} /></label><div className="flex gap-2">{reorderButtons(trustItems,(items) => setArray("trustItems",items),index)}<button type="button" className="text-xs text-red-300" onClick={() => setArray("trustItems",trustItems.filter((_,i) => i !== index))}>Delete</button></div></div>)}
      </div> : null}

      {tab === "Pricing" ? <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {[ ["title","Heading"],["subtitle","Subtitle"],["badgeText","Badge text"],["accentColor","Accent color"] ].map(([field,label]) => <label key={field} className="text-sm text-slate-300">{label}<input className={inputClass} value={String(pricing[field] ?? "")} onChange={(event) => updateRecord("pricing",field,event.target.value)} /></label>)}
        <label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={pricing.visible !== false} onChange={(event) => updateRecord("pricing","visible",event.target.checked)} /></label>
      </div> : null}

      {tab === "Plans" ? <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setArray("plans", [...plans, { name:"", description:"", price:"0", yearlyPrice:"0", billingCycle:"MONTHLY", buttonText:"", buttonUrl:"/registration", popular:false, active:true, sortOrder:plans.length, icon:"shield", accent:"cyan", features:[] }])}>Add plan</button>
        {plans.map((plan,index) => { const features=(plan.features ?? []) as RecordValue[]; return <div key={String(plan.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-3">
          {[ ["name","Name"],["badge","Badge"],["description","Description"],["price","Price"],["yearlyPrice","Yearly price"],["billingCycle","Billing cycle"],["buttonText","Button text"],["buttonUrl","Button URL"],["icon","Icon"],["accent","Accent"],["cardBackground","Card background"],["badgeColor","Badge color"],["borderColor","Border color"] ].map(([field,label]) => <label key={field} className="text-xs text-slate-300">{label}<input className={inputClass} value={String(plan[field] ?? "")} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,[field]:event.target.value} : value))} /></label>)}
          <label className="text-xs text-slate-300">Popular<input type="checkbox" className="ml-2" checked={plan.popular === true} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,popular:event.target.checked} : value))} /></label>
          <label className="text-xs text-slate-300">Active<input type="checkbox" className="ml-2" checked={plan.active !== false} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,active:event.target.checked} : value))} /></label>
          <div className="md:col-span-3 space-y-2"><button type="button" className="rounded-lg border border-cyan-400/30 px-3 py-1.5 text-xs text-cyan-200" onClick={() => setArray("plans",plans.map((value,i) => i === index ? {...value,features:[...features,{text:"",icon:"check",visible:true,sortOrder:features.length}]} : value))}>Add feature</button>{features.map((feature,featureIndex) => <div key={String(feature.id ?? featureIndex)} className="grid gap-2 md:grid-cols-4"><input className={inputClass} value={String(feature.text ?? "")} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,features:features.map((item,j) => j === featureIndex ? {...item,text:event.target.value} : item)} : value))} /><input className={inputClass} placeholder="Icon" value={String(feature.icon ?? "")} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,features:features.map((item,j) => j === featureIndex ? {...item,icon:event.target.value} : item)} : value))} /><label className="text-xs text-slate-300">Visible<input type="checkbox" className="ml-2" checked={feature.visible !== false} onChange={(event) => setArray("plans",plans.map((value,i) => i === index ? {...value,features:features.map((item,j) => j === featureIndex ? {...item,visible:event.target.checked} : item)} : value))} /></label><button type="button" className="text-xs text-red-300" onClick={() => setArray("plans",plans.map((value,i) => i === index ? {...value,features:features.filter((_,j) => j !== featureIndex)} : value))}>Delete feature</button></div>)}</div>
          <div className="md:col-span-3 flex items-center justify-between">{reorderButtons(plans,(items) => setArray("plans",items),index)}<button type="button" className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200" onClick={() => setArray("plans",plans.filter((_,i) => i !== index))}>Delete plan</button></div>
        </div>; })}

      {tab === "Comparison Table" ? ( <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6"><div className="grid gap-3 md:grid-cols-2"><label className="text-sm text-slate-300">Heading<input className={inputClass} value={String(comparison.title ?? "")} onChange={(event) => updateRecord("comparison","title",event.target.value)} /></label><label className="text-sm text-slate-300">Subtitle<input className={inputClass} value={String(comparison.subtitle ?? "")} onChange={(event) => updateRecord("comparison","subtitle",event.target.value)} /></label><label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={comparison.visible !== false} onChange={(event) => updateRecord("comparison","visible",event.target.checked)} /></label></div><button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setArray("comparisonRows",[...comparisonRows,{name:"",freeValue:"",starterValue:"",professionalValue:"",businessValue:"",enterpriseValue:"",sortOrder:comparisonRows.length,active:true}])}>Add row</button>{comparisonRows.map((row,index) => <div key={String(row.id ?? index)} className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-7">{["name","freeValue","starterValue","professionalValue","businessValue","enterpriseValue"].map((field) => <input key={field} className={inputClass} placeholder={field} value={String(row[field] ?? "")} onChange={(event) => setArray("comparisonRows",comparisonRows.map((value,i) => i === index ? {...value,[field]:event.target.value} : value))} />}<button type="button" className="text-xs text-red-300" onClick={() => setArray("comparisonRows",comparisonRows.filter((_,i) => i !== index))}>Delete</button></div>)}</div> : null}

      {tab === "FAQ" ? <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6"><div className="grid gap-3 md:grid-cols-2"><label className="text-sm text-slate-300">Heading<input className={inputClass} value={String(faq.title ?? "")} onChange={(event) => updateRecord("faq","title",event.target.value)} /></label><label className="text-sm text-slate-300">Subtitle<input className={inputClass} value={String(faq.subtitle ?? "")} onChange={(event) => updateRecord("faq","subtitle",event.target.value)} /></label><label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={faq.visible !== false} onChange={(event) => updateRecord("faq","visible",event.target.checked)} /></label></div><button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setArray("faqs",[...faqs,{question:"",answer:"",sortOrder:faqs.length,active:true}])}>Add FAQ</button>{faqs.map((item,index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4"><input className={inputClass} placeholder="Question" value={String(item.question ?? "")} onChange={(event) => setArray("faqs",faqs.map((value,i) => i === index ? {...value,question:event.target.value} : value))} /><textarea className={inputClass} rows={3} placeholder="Answer" value={String(item.answer ?? "")} onChange={(event) => setArray("faqs",faqs.map((value,i) => i === index ? {...value,answer:event.target.value} : value))} /><div className="flex justify-between">{reorderButtons(faqs,(items) => setArray("faqs",items),index)}<label className="text-xs text-slate-300">Active<input type="checkbox" className="ml-2" checked={item.active !== false} onChange={(event) => setArray("faqs",faqs.map((value,i) => i === index ? {...value,active:event.target.checked} : value))} /></label><button type="button" className="text-xs text-red-300" onClick={() => setArray("faqs",faqs.filter((_,i) => i !== index))}>Delete</button></div></div>)}</div> : null}

      {tab === "Testimonials" ? <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6"><div className="grid gap-3 md:grid-cols-2"><label className="text-sm text-slate-300">Heading<input className={inputClass} value={String(testimonials.title ?? "")} onChange={(event) => updateRecord("testimonials","title",event.target.value)} /></label><label className="text-sm text-slate-300">Subtitle<input className={inputClass} value={String(testimonials.subtitle ?? "")} onChange={(event) => updateRecord("testimonials","subtitle",event.target.value)} /></label><label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={testimonials.visible !== false} onChange={(event) => updateRecord("testimonials","visible",event.target.checked)} /></label></div><button type="button" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setArray("testimonialItems",[...testimonialItems,{name:"",company:"",designation:"",image:"",rating:5,review:"",active:true,sortOrder:testimonialItems.length}])}>Add testimonial</button>{testimonialItems.map((item,index) => <div key={String(item.id ?? index)} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 md:grid-cols-2">{[["name","Name"],["company","Company"],["designation","Designation"],["rating","Rating"]].map(([field,label]) => <label key={field} className="text-xs text-slate-300">{label}<input className={inputClass} value={String(item[field] ?? "")} onChange={(event) => setArray("testimonialItems",testimonialItems.map((value,i) => i === index ? {...value,[field]:event.target.value} : value))} /></label>)}<label className="text-xs text-slate-300 md:col-span-2">Review<textarea className={inputClass} rows={3} value={String(item.review ?? "")} onChange={(event) => setArray("testimonialItems",testimonialItems.map((value,i) => i === index ? {...value,review:event.target.value} : value))} /></label><ImageField label="Image" value={item.image} targetKey="testimonialItems" targetField="image" /><button type="button" className="text-xs text-red-300" onClick={() => setArray("testimonialItems",testimonialItems.filter((_,i) => i !== index))}>Delete</button></div>)}</div> : null}

      {tab === "CTA" ? <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:grid-cols-2">
        {[ ["title","Title"],["description","Description"],["buttonText","Button text"],["buttonUrl","Button URL"] ].map(([field,label]) => <label key={field} className="text-sm text-slate-300">{label}<input className={inputClass} value={String(cta[field] ?? "")} onChange={(event) => updateRecord("cta",field,event.target.value)} /></label>)}
        <ImageField label="Background image" value={cta.backgroundImage} targetKey="cta" targetField="backgroundImage" /><label className="text-sm text-slate-300">Visible<input type="checkbox" className="ml-2" checked={cta.visible !== false} onChange={(event) => updateRecord("cta","visible",event.target.checked)} /></label>
      </div> : null}

      <button type="button" onClick={() => void save()} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Save subscription CMS</button>{message ? <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}
*/
