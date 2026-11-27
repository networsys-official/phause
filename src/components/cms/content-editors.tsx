"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  detectDuplicatePosition,
  hasPageChanges,
  normalizeSlug,
  validatePageSectionProps,
} from "@/features/cms/cms-service";
import { serializeContactDetails } from "@/features/cms/page-builder";
import { cn } from "@/lib/utils";
import type { CmsSaveResponse } from "@/features/cms/cms-page-contract";
import { PageMenuFields, type PageMenuDraft } from "@/components/cms/PageMenuFields";
import { PageForm, type PageFormValue } from "@/components/cms/PageForm";
import { FormCreateEditor } from "@/components/cms/FormCreateEditor";

type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: string;
  showInHeader?: boolean;
  headerLabel?: string;
  headerPosition?: number;
  showInFooter?: boolean;
  footerGroup?: string;
  footerLabel?: string;
  footerPosition?: number;
  pageId?: string;
  pageTitle?: string;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    canonical?: string | null;
  };
  blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>;
};

type NavigationItem = { id?: string; pageId?: string | null; pageTitle?: string | null; type?: string; label: string; href: string; position: number };

type FooterRecord = {
  title: string;
  description: string;
  copyright?: string | null;
  links: NavigationItem[];
};

type SeoEntry = {
  slug: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  canonical?: string | null;
};

type MediaRecord = {
  id: string;
  title: string;
  altText?: string | null;
  caption?: string | null;
  url: string;
  mimeType: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  tags?: string[] | null;
};

function confirmDeleteAction(label: string) {
  return window.confirm(`This action is permanent. Are you sure you want to delete ${label}?`);
}

async function requestJson<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  let data: Record<string, unknown> | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (response.redirected || response.status === 401 || response.status === 403) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      throw new Error("The CMS endpoint returned an unexpected response. Please refresh and try again.");
    }
  }

  if (!response.ok) {
    throw new Error((data && typeof data.message === "string" ? data.message : "Request failed"));
  }

  if (contentType.includes("application/json") && data === null) {
    return { success: true } as T;
  }

  return (data ?? { success: true }) as T;
}

function normalizeBlockRecord(block: { id: string; type: string; order: number; props?: Record<string, unknown> }) {
  const props = (block.props ?? {}) as Record<string, unknown>;

  const nextProps: Record<string, unknown> = { ...props };
  const normalizedType = String(block.type ?? "").toLowerCase();

  if (typeof nextProps.ctaPrimary === "string" && typeof nextProps.buttonText !== "string") {
    nextProps.buttonText = nextProps.ctaPrimary;
  }

  if (typeof nextProps.ctaPrimaryHref === "string" && typeof nextProps.buttonLink !== "string") {
    nextProps.buttonLink = nextProps.ctaPrimaryHref;
  }

  if (typeof nextProps.position === "number") {
    nextProps.position = nextProps.position;
  } else if (typeof block.order === "number") {
    nextProps.position = block.order;
  }

  if (typeof nextProps.visibility !== "boolean") {
    nextProps.visibility = true;
  }

  if (Array.isArray(nextProps.details)) {
    nextProps.details = serializeContactDetails(nextProps.details);
  }

  return {
    id: block.id,
    type: normalizedType,
    order: block.order,
    props: nextProps,
  };
}

export function normalizeEditableSectionItems(sectionType: string, items: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      return { id: `item-${index + 1}` };
    }

    const record = { ...(item as Record<string, unknown>) };
    const normalizedType = String(sectionType ?? "").toLowerCase();

    const title = typeof record.title === "string" ? record.title : typeof record.label === "string" ? record.label : typeof record.name === "string" ? record.name : "";
    const description = typeof record.description === "string" ? record.description : typeof record.desc === "string" ? record.desc : "";
    const question = typeof record.question === "string" ? record.question : typeof record.q === "string" ? record.q : "";
    const answer = typeof record.answer === "string" ? record.answer : typeof record.a === "string" ? record.a : "";
    const icon = typeof record.icon === "string" ? record.icon : "";

    return {
      ...record,
      id: typeof record.id === "string" ? record.id : `item-${index + 1}`,
      title,
      description,
      question,
      answer,
      icon,
      ...(normalizedType === "faq" ? { title: question, description: answer } : {}),
    };
  });
}

export function PageSectionEditor({ page, blocks, media }: { page: { id: string; slug: string; title: string; status: string; version?: number; showInHeader?: boolean; headerLabel?: string; headerPosition?: number; showInFooter?: boolean; footerGroup?: string; footerLabel?: string; footerPosition?: number }; blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>; media: Array<{ id: string; title: string; url: string; mimeType: string }> }) {
  const router = useRouter();
  const initialRef = useRef(blocks.map((block) => normalizeBlockRecord(block)));
  const [sections, setSections] = useState(() => blocks.map((block) => normalizeBlockRecord(block)));
  const [pageVersion, setPageVersion] = useState(page.version ?? 1);
  const [draft, setDraft] = useState<PageMenuDraft>({
    showInHeader: page.showInHeader ?? false,
    headerLabel: page.headerLabel ?? page.title,
    headerPosition: page.headerPosition ?? 0,
    showInFooter: page.showInFooter ?? false,
    footerGroup: page.footerGroup === "SERVICES" || page.footerGroup === "LEGAL" ? page.footerGroup : "QUICK_LINKS",
    footerLabel: page.footerLabel ?? page.title,
    footerPosition: page.footerPosition ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [publishedForms, setPublishedForms] = useState<Array<{ slug: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/cms/forms").then((response) => response.json()).then((payload) => {
      if (Array.isArray(payload.forms)) setPublishedForms(payload.forms.filter((form: { status?: string }) => form.status === "PUBLISHED").map((form: { slug: string; name: string }) => ({ slug: form.slug, name: form.name })));
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateSection = (id: string, patch: Record<string, unknown>) => {
    setSections((current) => current.map((section) => section.id === id ? {
      ...section,
      props: { ...section.props, ...patch },
    } : section));
    setDirty(true);
  };

  const updateItem = (sectionId: string, itemIndex: number, patch: Record<string, unknown>) => {
    setSections((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const items = normalizeEditableSectionItems(String(section.type), section.props.items);
      items[itemIndex] = { ...items[itemIndex], ...patch };
      return { ...section, props: { ...section.props, items } };
    }));
    setDirty(true);
  };

  const moveItem = (sectionId: string, itemIndex: number, direction: -1 | 1) => {
    setSections((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const items = normalizeEditableSectionItems(String(section.type), section.props.items);
      const target = itemIndex + direction;
      if (target < 0 || target >= items.length) return section;
      [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
      return { ...section, props: { ...section.props, items } };
    }));
    setDirty(true);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((section, order) => ({ ...section, order, props: { ...section.props, order, position: order } }));
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setToast(null);
    const payload = {
      id: page.id,
      version: pageVersion,
      slug: page.slug,
      title: page.title,
      status: page.status,
      showInHeader: draft.showInHeader,
      headerLabel: draft.headerLabel || page.title,
      headerPosition: draft.headerPosition,
      showInFooter: draft.showInFooter,
      footerGroup: draft.footerGroup,
      footerLabel: draft.footerLabel || page.title,
      footerPosition: draft.footerPosition,
      blocks: sections.map((section, index) => ({
        id: section.id,
        type: String(section.type).toLowerCase(),
        order: index,
        props: {
          ...section.props,
          position: Number(section.props.position ?? index),
          visibility: section.props.visibility !== false,
        },
      })),
    };

    try {
      let saved: CmsSaveResponse;
      try {
        saved = await requestJson<CmsSaveResponse>("/api/cms/pages", "PUT", payload);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Page save failed.";
        if (/changed in another tab|version conflict/i.test(reason)) {
          const latest = await requestJson<{ success: boolean; page?: CmsSaveResponse["page"] }>("/api/cms/pages?slug=" + encodeURIComponent(page.slug), "GET");
          if (!latest.page) throw error;
          setPageVersion(latest.page.version);
          saved = await requestJson<CmsSaveResponse>("/api/cms/pages", "PUT", { ...payload, version: latest.page.version });
        } else {
          throw error;
        }
      }
      if (!saved.success || !saved.page) throw new Error("The server did not confirm the saved page.");
      setPageVersion(saved.page.version);
      setSections(saved.page.blocks.map((block) => normalizeBlockRecord(block)));
      initialRef.current = saved.page.blocks.map((block) => normalizeBlockRecord(block));
      setDirty(false);
      window.localStorage.setItem("phause:cms-page-updated", String(Date.now()));
      setToast({ type: "success", message: `✅ ${page.title} page updated successfully` });
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Page save failed.";
      setToast({ type: "error", message: reason });
    } finally {
      setSaving(false);
    }
  };

  const addItem = (sectionId: string) => {
    setSections((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const items = normalizeEditableSectionItems(String(section.type), section.props.items);
      items.push({ id: `item-${items.length + 1}`, title: "New item", description: "", question: "", answer: "", icon: "" });
      return { ...section, props: { ...section.props, items } };
    }));
    setDirty(true);
  };

  const removeItem = (sectionId: string, itemIndex: number) => {
    setSections((current) => current.map((section) => {
      if (section.id !== sectionId) return section;
      const items = normalizeEditableSectionItems(String(section.type), section.props.items).filter((_, index) => index !== itemIndex);
      return { ...section, props: { ...section.props, items } };
    }));
    setDirty(true);
  };

  const knownSectionFields = new Set(["title", "subtitle", "description", "buttonText", "buttonLink", "secondaryButtonText", "secondaryButtonLink", "eyebrow", "image", "visibility", "position", "items", "details", "ctaPrimary", "ctaPrimaryHref", "ctaSecondary", "ctaSecondaryHref"]);

  return (
    <div className="space-y-6">
      {toast ? <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : toast.type === "error" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"}`}>{toast.message}</div> : null}
      {dirty ? <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">You have unsaved section changes.</div> : null}

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-white">Page sections</h2><p className="text-sm text-slate-400">Edit every block prop, nested item, link, and visibility setting.</p></div>
          <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : "Save all sections"}</button>
        </div>
      </div>

      {sections.map((section, index) => {
        const props = section.props;
        const items = normalizeEditableSectionItems(String(section.type), props.items);
        const unknownEntries = Object.entries(props).filter(([key]) => !knownSectionFields.has(key));
        return (
          <div key={section.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-5 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{section.type}</div><h3 className="mt-1 text-lg font-bold text-white">Section {index + 1}</h3></div>
              <div className="flex gap-2"><button type="button" aria-label={`Move section ${index + 1} up`} onClick={() => moveSection(index, -1)} className="rounded border border-white/10 px-2 py-1 text-white">↑</button><button type="button" aria-label={`Move section ${index + 1} down`} onClick={() => moveSection(index, 1)} className="rounded border border-white/10 px-2 py-1 text-white">↓</button><label className="text-xs text-slate-200"><input type="checkbox" checked={props.visibility !== false} onChange={(event) => updateSection(section.id, { visibility: event.target.checked })}/> Visible</label></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">Eyebrow<input aria-label="Eyebrow" value={String(props.eyebrow ?? props.tag ?? "")} onChange={(event) => updateSection(section.id, { eyebrow: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Title<input required aria-label={`Title for section ${index + 1}`} value={String(props.title ?? "")} onChange={(event) => updateSection(section.id, { title: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Subtitle<input aria-label="Subtitle" value={String(props.subtitle ?? "")} onChange={(event) => updateSection(section.id, { subtitle: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Image<input aria-label="Image" value={String(props.image ?? props.imageUrl ?? props.mediaUrl ?? "")} onChange={(event) => updateSection(section.id, { image: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300 md:col-span-2">Description<textarea aria-label="Description" rows={4} value={typeof props.description === "object" ? JSON.stringify(props.description, null, 2) : String(props.description ?? "")} onChange={(event) => updateSection(section.id, { description: typeof props.description === "object" ? (() => { try { return JSON.parse(event.target.value); } catch { return props.description; } })() : event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Primary button text<input aria-label="Primary button text" value={String(props.buttonText ?? props.ctaPrimary ?? "")} onChange={(event) => updateSection(section.id, { buttonText: event.target.value, ctaPrimary: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Primary button link<input aria-label="Primary button link" value={String(props.buttonLink ?? props.ctaPrimaryHref ?? "")} onChange={(event) => updateSection(section.id, { buttonLink: event.target.value, ctaPrimaryHref: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Secondary button text<input aria-label="Secondary button text" value={String(props.secondaryButtonText ?? props.ctaSecondary ?? "")} onChange={(event) => updateSection(section.id, { secondaryButtonText: event.target.value, ctaSecondary: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Secondary button link<input aria-label="Secondary button link" value={String(props.secondaryButtonLink ?? props.ctaSecondaryHref ?? "")} onChange={(event) => updateSection(section.id, { secondaryButtonLink: event.target.value, ctaSecondaryHref: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
              <label className="text-sm text-slate-300">Position<input type="number" value={Number(props.position ?? index)} onChange={(event) => updateSection(section.id, { position: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>

              {unknownEntries.map(([key, value]) => (
                <label key={key} className="text-sm text-slate-300 md:col-span-2">{key}{typeof value === "boolean" ? <input aria-label={key} type="checkbox" checked={value} onChange={(event) => updateSection(section.id, { [key]: event.target.checked })} className="ml-2" /> : typeof value === "object" ? <textarea aria-label={key} rows={3} value={JSON.stringify(value, null, 2)} onChange={(event) => { try { updateSection(section.id, { [key]: JSON.parse(event.target.value) }); } catch {} }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-white" /> : <input aria-label={key} value={String(value ?? "")} onChange={(event) => updateSection(section.id, { [key]: value === null ? event.target.value : typeof value === "number" ? Number(event.target.value) : event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />}</label>
              ))}

              {(Array.isArray(props.items) || items.length > 0) ? (
                <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 p-4">
                  <div className="mb-3 flex items-center justify-between"><b className="text-white">List items</b><button type="button" onClick={() => addItem(section.id)} className="rounded border border-cyan-400/40 px-3 py-1 text-cyan-200">Add item</button></div>
                  <div className="space-y-3">{items.map((item, itemIndex) => (
                    <div key={String(item.id ?? itemIndex)} className="rounded-xl border border-white/10 p-3">
                      <div className="mb-2 flex justify-end gap-2"><button type="button" onClick={() => moveItem(section.id, itemIndex, -1)} className="rounded border border-white/10 px-2 text-white">↑</button><button type="button" onClick={() => moveItem(section.id, itemIndex, 1)} className="rounded border border-white/10 px-2 text-white">↓</button><button type="button" onClick={() => removeItem(section.id, itemIndex)} className="rounded border border-red-500/40 px-2 text-red-200">Remove</button></div>
                      <div className="grid gap-3 md:grid-cols-2">{Object.entries(item).map(([key, value]) => (
                        <label key={key} className="text-xs text-slate-300 md:col-span-1">{key}{typeof value === "object" ? <textarea aria-label={`Item ${itemIndex + 1} ${key}`} rows={3} value={JSON.stringify(value, null, 2)} onChange={(event) => { try { updateItem(section.id, itemIndex, { [key]: JSON.parse(event.target.value) }); } catch {} }} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 font-mono text-xs text-white" /> : <input aria-label={`Item ${itemIndex + 1} ${key}`} value={String(value ?? "")} onChange={(event) => updateItem(section.id, itemIndex, { [key]: typeof value === "number" ? Number(event.target.value) : event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-white" />}</label>
                      ))}</div>
                    </div>
                  ))}</div>
                </div>
              ) : null}

              {String(section.type).toLowerCase() === "contact" ? (
                <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 p-4"><div className="mb-3 flex items-center justify-between"><b className="text-white">Contact details</b><button type="button" onClick={() => updateSection(section.id, { details: [...serializeContactDetails(props.details), { id: `contact-detail-${serializeContactDetails(props.details).length + 1}`, label: "", value: "", note: "" }] })} className="rounded border border-cyan-400/40 px-3 py-1 text-cyan-200">Add item</button></div>
                  <div className="space-y-3">{serializeContactDetails(props.details).map((detail, detailIndex) => (
                    <div key={detail.id} className="grid gap-2 md:grid-cols-4"><input aria-label="Contact label" value={detail.label} onChange={(event) => { const details = serializeContactDetails(props.details); details[detailIndex] = { ...details[detailIndex], label: event.target.value }; updateSection(section.id, { details }); }} className="rounded border border-white/10 bg-slate-950 px-2 py-2 text-white"/><input aria-label="Contact value" value={detail.value} onChange={(event) => { const details = serializeContactDetails(props.details); details[detailIndex] = { ...details[detailIndex], value: event.target.value }; updateSection(section.id, { details }); }} className="rounded border border-white/10 bg-slate-950 px-2 py-2 text-white"/><input aria-label="Contact note" value={detail.note} onChange={(event) => { const details = serializeContactDetails(props.details); details[detailIndex] = { ...details[detailIndex], note: event.target.value }; updateSection(section.id, { details }); }} className="rounded border border-white/10 bg-slate-950 px-2 py-2 text-white"/><button type="button" onClick={() => { const details = serializeContactDetails(props.details).filter((_, i) => i !== detailIndex); updateSection(section.id, { details }); }} className="rounded border border-red-500/40 text-red-200">Remove</button></div>
                  ))}</div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <PageMenuFields page={page} draft={draft} setDraft={setDraft} markChanged={() => setDirty(true)} />

      <div className="flex justify-end"><button type="button" onClick={save} disabled={saving} className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : "Save all sections"}</button></div>
    </div>
  );
}

export function NavigationEditor({ navigation }: { navigation: { key: string; label: string; items: NavigationItem[] } }) {
  const [items, setItems] = useState(navigation.items);
  const [message, setMessage] = useState("");
  const save = async () => {
    try {
      await requestJson("/api/navigation", "PUT", { key: navigation.key, label: navigation.label, items });
      setMessage("Navigation saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Navigation save failed.");
    }
  };
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Navigation</h2><div className="mt-4 space-y-3">{items.map((item, index) => <div key={item.id ?? `${item.href}-${index}`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 md:grid-cols-[1fr_1fr_100px]"><div className="space-y-1"><input value={item.label} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation label" />{item.pageId ? <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">Linked to page: {item.pageTitle ?? item.label}</span> : null}</div><input value={item.href} readOnly={Boolean(item.pageId)} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, href: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation URL" /><input type="number" value={item.position} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, position: Number(event.target.value) } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation order" /></div>)}</div><button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-3 text-slate-950">Save navigation</button>{message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}</div>;
}

export function FooterEditor({ footer }: { footer: FooterRecord }) {
  const [title, setTitle] = useState(footer.title);
  const [description, setDescription] = useState(footer.description);
  const [copyright, setCopyright] = useState(footer.copyright ?? "");
  const [links, setLinks] = useState(footer.links);
  const [message, setMessage] = useState("");
  const save = async () => {
    try {
      await requestJson("/api/footer", "PUT", { title, description, copyright, links });
      setMessage("Footer saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Footer save failed.");
    }
  };
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">Footer</h2>
      <div className="mt-4 grid gap-3">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer title" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer description" />
        <input value={copyright} onChange={(event) => setCopyright(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer copyright" />
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={link.id ?? `${link.href}-${index}`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 md:grid-cols-[1fr_1fr_100px]">
              <div className="space-y-1">
                <input value={link.label} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer label" />
                {link.pageId ? <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">Linked to page: {link.pageTitle ?? link.label}</span> : null}
              </div>
              <input value={link.href} readOnly={Boolean(link.pageId)} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, href: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer URL" />
              <input type="number" value={link.position} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, position: Number(event.target.value) } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer order" />
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Save footer</button>
      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function PagesEditor({ pages }: { pages: PageRecord[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createView = searchParams.get("view") === "create";
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const onDelete = async (page: PageRecord) => {
    if (["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"].includes(page.slug)) {
      setToast({ type: "error", message: "System pages cannot be deleted." });
      return;
    }
    if (!confirmDeleteAction(`page "${page.title}"`)) return;
    try {
      await requestJson("/api/cms/pages", "DELETE", { slug: page.slug });
      setToast({ type: "success", message: `Deleted page ${page.title}.` });
      router.refresh();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Delete failed." });
    }
  };

  const createPage = async (value: PageFormValue) => {
    const starterBlocks = value.starter === "BLANK"
      ? [{ type: "hero", order: 0, props: { title: value.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } }]
      : value.starter === "HERO_TEXT_CTA"
        ? [
            { type: "hero", order: 0, props: { title: value.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } },
            { type: "richText", order: 1, props: { title: "", description: "" } },
            { type: "cta", order: 2, props: { title: "", description: "", buttonText: "", buttonLink: "" } },
          ]
        : [
            { type: "hero", order: 0, props: { title: value.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } },
            { type: "richText", order: 1, props: { title: "", description: "" } },
          ];

    const saved = await requestJson<CmsSaveResponse>("/api/cms/pages", "POST", {
      title: value.title,
      slug: normalizeSlug(value.slug || value.title),
      status: value.status,
      starter: value.starter,
      showInHeader: value.showInHeader,
      headerLabel: value.headerLabel || value.title,
      headerPosition: value.headerPosition,
      showInFooter: value.showInFooter,
      footerGroup: value.footerGroup,
      footerLabel: value.footerLabel || value.title,
      footerPosition: value.footerPosition,
      blocks: starterBlocks,
      seo: { title: value.seoTitle || value.title, description: value.seoDescription || null },
    });
    if (!saved.success || !saved.page) throw new Error("The server did not confirm that the page was created.");
    setToast({ type: "success", message: `Created page ${saved.page.title}.` });
    router.push(`/cms/pages/${saved.page.slug}`);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      {toast ? <div className={`xl:col-span-2 rounded-xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100"}`} role="status">{toast.message}</div> : null}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Page list</h2>{!createView ? <button type="button" onClick={() => router.push("/studio/pages?view=create")} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Add page</button> : null}</div>
        <div className="mt-4 space-y-3">{pages.map((page) => <div key={page.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><div><div className="font-semibold text-white">{page.title}</div><div className="text-sm text-cyan-300">/{page.slug}</div></div><div className="flex gap-2"><button type="button" onClick={() => router.push(`/cms/pages/${page.slug}`)} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">Edit</button><button type="button" disabled={["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"].includes(page.slug)} onClick={() => onDelete(page)} className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 disabled:cursor-not-allowed disabled:opacity-40">Delete</button></div></div>)}</div>
      </div>
      {createView ? (
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Create a page</h2><button type="button" onClick={() => router.push("/studio/pages")} className="text-sm text-slate-300 hover:text-white">Close</button></div>
          <PageForm existingSlugs={pages.map((page) => page.slug)} onSubmit={async (value) => { await createPage(value); }} />
        </div>
      ) : null}
    </div>
  );
}

export function SeoEditor({ entries }: { entries: SeoEntry[] }) {
  const [items, setItems] = useState(entries);
  const [message, setMessage] = useState("");
  const save = async (entry: SeoEntry) => {
    try {
      const saved = await requestJson<{ success: boolean }>("/api/cms/seo", "PUT", entry);
      if (!saved.success) throw new Error("SEO save failed.");
      setMessage("SEO saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SEO save failed.");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">SEO</h2>
      <p className="mt-1 text-sm text-slate-400">Edit search titles and descriptions for public pages.</p>
      <div className="mt-4 space-y-4">
        {items.map((entry, index) => (
          <div key={entry.slug} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-4">
            <div className="font-semibold text-cyan-300">/{entry.slug}</div>
            <label className="block text-sm text-slate-300">Page title<input value={entry.title ?? ""} maxLength={60} onChange={(event) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" /><span className="mt-1 block text-xs text-slate-400">{(entry.title ?? "").length}/60 characters</span></label>
            <label className="block text-sm text-slate-300">Description<textarea value={entry.description ?? ""} maxLength={160} rows={3} onChange={(event) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" /><span className="mt-1 block text-xs text-slate-400">{(entry.description ?? "").length}/160 characters</span></label>
            <button type="button" onClick={() => void save(entry)} className="w-fit rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Save SEO</button>
          </div>
        ))}
      </div>
      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function MediaEditor({ media }: { media: MediaRecord[] }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Media</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950 p-3"><div className="font-semibold text-white">{item.title}</div><div className="mt-1 truncate text-xs text-cyan-300">{item.url}</div></div>)}</div></div>;
}

export function SettingsEditor({ settings }: { settings: Array<{ id: string; key: string; slug: string; value: string; status: string; version: number }> }) {
  const [rows, setRows] = useState(settings);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const systemKeys = new Set(["siteName", "timezone", "publishingMode", "cmsApiEnabled", "mediaPipelineEnabled", "seoSyncEnabled", "supportEmail", "supportPhone", "logoUrl"]);
  const timezoneOptions = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

  useEffect(() => {
    void fetch("/api/media").then((response) => response.json()).then((payload) => {
      const media = Array.isArray(payload?.media) ? payload.media : [];
      setMediaUrls(media.map((item: { url?: string }) => String(item.url ?? "")).filter(Boolean));
    }).catch(() => setMediaUrls([]));
  }, []);

  const beginEdit = (setting: (typeof rows)[number]) => {
    setEditing(setting.id);
    setDraft(setting.value);
    setMessage("");
    setError("");
  };

  const save = async (setting: (typeof rows)[number], status: "DRAFT" | "PUBLISHED") => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await requestJson<{ success: boolean; settings: Array<{ id: string; key: string; slug: string; value: string; status: string; version: number }> }>("/api/cms/settings", "POST", { id: setting.id, key: setting.key, slug: setting.slug, value: draft, status, version: setting.version });
      if (!saved.success) throw new Error("Setting save failed.");
      setRows((current) => current.map((row) => row.id === setting.id ? { ...row, value: draft, status, version: row.version + 1 } : row));
      setEditing(null);
      setMessage(status === "PUBLISHED" ? `${setting.key} published.` : `${setting.key} saved as draft.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Setting save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (setting: (typeof rows)[number]) => {
    if (systemKeys.has(setting.key)) return;
    if (!confirmDeleteAction(`setting "${setting.key}"`)) return;
    try {
      await requestJson("/api/cms/settings", "DELETE", { id: setting.id, key: setting.key });
      setRows((current) => current.filter((row) => row.id !== setting.id));
      setMessage(`${setting.key} deleted.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Setting delete failed.");
    }
  };

  const inputFor = (setting: (typeof rows)[number]) => {
    if (["cmsApiEnabled", "mediaPipelineEnabled", "seoSyncEnabled"].includes(setting.key)) {
      return <select aria-label={`${setting.key} value`} value={draft === "true" ? "true" : "false"} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"><option value="true">Enabled</option><option value="false">Disabled</option></select>;
    }
    if (setting.key === "publishingMode") {
      return <select aria-label="Publishing mode" value={["Draft + publish", "Draft only", "Publish immediately"].includes(draft) ? draft : "Draft + publish"} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"><option>Draft + publish</option><option>Draft only</option><option>Publish immediately</option></select>;
    }
    if (setting.key === "timezone") {
      return <select aria-label="Timezone" value={timezoneOptions.includes(draft) ? draft : "UTC"} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white">{timezoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select>;
    }
    if (setting.key === "supportEmail") {
      return <input aria-label="Support email" type="email" value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" />;
    }
    if (setting.key === "supportPhone") {
      return <input aria-label="Support phone" type="tel" value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" />;
    }
    if (setting.key === "logoUrl") {
      return <div className="grid gap-2"><input aria-label="Logo URL" value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" />{mediaUrls.length ? <select aria-label="Choose media logo" value="" onChange={(event) => event.target.value && setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white"><option value="">Choose from media library</option>{mediaUrls.map((url) => <option key={url} value={url}>{url}</option>)}</select> : null}</div>;
    }
    if (setting.key === "siteName") {
      return <input aria-label="Site name" required value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" />;
    }
    return <input aria-label={`${setting.key} value`} value={draft} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" />;
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>
      {message ? <div role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      <div className="mt-4 space-y-3">
        {rows.map((setting) => (
          <div key={setting.id} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-4">
            {editing === setting.id ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between"><div className="font-semibold text-white">{setting.key}</div><div className="text-xs text-slate-400">{setting.status} · v{setting.version}</div></div>
                {inputFor(setting)}
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isSaving} onClick={() => save(setting, "DRAFT")} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">{isSaving ? "Saving..." : "Save"}</button>
                  <button type="button" disabled={isSaving} onClick={() => save(setting, "PUBLISHED")} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{isSaving ? "Publishing..." : "Publish"}</button>
                  <button type="button" disabled={isSaving} onClick={() => { setEditing(null); setDraft(setting.value); setError(""); }} className="rounded-lg px-3 py-2 text-sm text-slate-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-center">
                <div className="font-semibold text-white">{setting.key}</div>
                <div className="text-sm text-slate-300">{setting.value}</div>
                <div className="flex items-center gap-2"><span className="text-xs text-slate-400">{setting.status} · v{setting.version}</span><button type="button" onClick={() => beginEdit(setting)} className="rounded-lg border border-cyan-400/30 px-2.5 py-1.5 text-xs text-cyan-200">Edit</button>{!systemKeys.has(setting.key) ? <button type="button" onClick={() => remove(setting)} className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-200">Delete</button> : null}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormsEditor({ forms }: { forms: Array<{ id: string; name: string; slug: string; status: string; fields: unknown[]; usedOn?: string[] }> }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState(searchParams.get("view") === "create" ? "create" : "list");
  useEffect(() => { setView(searchParams.get("view") === "create" ? "create" : "list"); }, [searchParams]);
  if (view === "create") return <FormCreateEditor existingSlugs={forms.map((form) => form.slug)} />;
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Forms</h2><button type="button" onClick={() => setView("create")} className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">Create form</button></div>
    <div className="mt-4 space-y-2">{forms.map((form) => <div key={form.id} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3">
      <div className="font-semibold text-white">{form.name}</div>
      <div className="mt-1 truncate text-xs text-cyan-300">/{form.slug} · {form.status} · {form.fields.length} fields</div>
      {form.status === "PUBLISHED" ? <>
        <div className="mt-1 text-xs text-cyan-200">Used on: {form.usedOn?.length ? form.usedOn.join(", ") : "none"}</div>
        <div className="mt-2 flex gap-2"><span className="text-xs text-cyan-200">/forms/{form.slug}</span><button type="button" onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}/forms/${form.slug}`)} className="rounded-lg border border-cyan-400/30 px-2 py-1 text-xs text-cyan-200">Copy link</button><a href={`/forms/${form.slug}`} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white">Open</a></div>
      </> : <div className="mt-1 text-xs text-slate-400">Publish to get a public link</div>}
    </div>)}</div>
  </div>;
}
