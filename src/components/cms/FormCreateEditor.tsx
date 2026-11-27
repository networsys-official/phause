"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { CmsFormField } from "@/features/cms/form-schema";

const fieldTypes = [
  ["text", "Text"], ["email", "Email"], ["tel", "Phone"], ["textarea", "Textarea"],
  ["select", "Select"], ["radio", "Radio"], ["checkbox", "Checkbox"], ["number", "Number"], ["date", "Date"],
] as const;

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export function generateFieldKey(label: string, fields: CmsFormField[], usedIndex?: number) {
  const base = normalizeSlug(label).replace(/-/g, "_") || `field_${typeof usedIndex === "number" ? usedIndex + 1 : fields.length + 1}`;
  const used = new Set(fields.filter((_, index) => index !== usedIndex).map((field) => field.key.toLowerCase()).filter(Boolean));
  let key = base;
  let suffix = 2;
  while (used.has(key.toLowerCase())) key = `${base}_${suffix++}`;
  return key;
}

function fieldKey(label: string, fields: CmsFormField[]) {
  return generateFieldKey(label, fields);
}

async function copyPublicUrl(path: string) {
  await navigator.clipboard?.writeText(`${window.location.origin}${path}`);
}

async function postForm(payload: Record<string, unknown>) {
  const response = await fetch("/api/cms/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || "Unable to save the form.");
  return data;
}

export function FormCreateEditor({ existingSlugs }: { existingSlugs: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fields, setFields] = useState<CmsFormField[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [keyEdited, setKeyEdited] = useState<Set<number>>(new Set());
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string; status: string; version: number; blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }> }>>([]);
  const [placementPageSlug, setPlacementPageSlug] = useState("");
  const [placementPosition, setPlacementPosition] = useState<"top" | "bottom" | "after">("bottom");
  const [afterBlockId, setAfterBlockId] = useState("");
  const dirty = Boolean(name || slug || fields.length || placementPageSlug);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const updateName = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(normalizeSlug(value));
  };

  const addField = () => {
    const next = { label: "", key: "", type: "text" as const, placeholder: "", required: false, options: [] };
    setFields((current) => [...current, next]);
  };

  const updateField = (index: number, patch: Partial<CmsFormField>) => {
    if (typeof patch.label === "string" && !keyEdited.has(index)) {
      setFields((current) => current.map((field, fieldIndex) => {
        if (fieldIndex !== index) return field;
        const generated = generateFieldKey(patch.label as string, current, index);
        return { ...field, label: patch.label as string, key: generated };
      }));
      return;
    }
    setFields((current) => current.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field));
  };

  const removeField = (index: number) => setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
  const moveField = (index: number, direction: -1 | 1) => {
    setFields((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };
  const duplicateField = (index: number) => setFields((current) => {
    const copy = { ...current[index], key: fieldKey(`${current[index].label || "field"}_copy`, current) };
    copy.options = [...(copy.options ?? [])];
    const next = [...current];
    next.splice(index + 1, 0, copy);
    return next;
  });

  const cancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes to this form?")) return;
    router.push("/studio/forms");
  };

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    setLoading(true);
    setSuccess("");
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!slug.trim()) nextErrors.slug = "Slug is required.";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) nextErrors.slug = "Use lowercase letters, numbers, and hyphens only.";
    else if (existingSlugs.includes(slug)) nextErrors.slug = "This slug is already in use.";

    const keys = new Set<string>();
    fields.forEach((field, index) => {
      if (!field.label.trim()) nextErrors[`label_${index}`] = "Label is required.";
      if (!field.key.trim()) nextErrors[`key_${index}`] = "Key is required.";
      else if (!/^[a-z][a-z0-9_]*$/i.test(field.key)) nextErrors[`key_${index}`] = "Use letters, numbers, and underscores; start with a letter.";
      else if (keys.has(field.key.toLowerCase())) nextErrors[`key_${index}`] = "Field keys must be unique.";
      else keys.add(field.key.toLowerCase());
      if ((field.type === "select" || field.type === "radio") && (!field.options || field.options.length === 0)) nextErrors[`options_${index}`] = "Add at least one option.";
    });
    if (status === "PUBLISHED" && fields.length === 0) nextErrors.fields = "Add at least one field before publishing.";

    let placement: { pageSlug: string; pageVersion: number; position: "top" | "bottom" | "after"; afterBlockId?: string } | undefined;
    if (status === "PUBLISHED" && placementPageSlug) {
      const selectedPage = pages.find((page) => page.slug === placementPageSlug);
      if (!selectedPage) nextErrors.placement = "The selected page could not be found.";
      else if (placementPosition === "after" && !afterBlockId) nextErrors.placement = "Choose a block to place the form after.";
      else placement = { pageSlug: selectedPage.slug, pageVersion: selectedPage.version, position: placementPosition, ...(placementPosition === "after" ? { afterBlockId } : {}) };
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setLoading(false);
      return;
    }

    try {
      await postForm({ name: name.trim(), slug, status, fields, placement });
      setSuccess(status === "PUBLISHED" ? "Form published successfully." : "Draft saved successfully.");
      setPublishedUrl(status === "PUBLISHED" ? `/forms/${slug}` : "");
      if (status === "DRAFT") setTimeout(() => router.push("/studio/forms"), 350);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to save the form." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/pages")
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        if (Array.isArray(payload.pages)) setPages(payload.pages);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  if (publishedUrl) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
        <div role="status">
          <h2 className="text-xl font-bold text-emerald-100">{success || "Form published successfully."}</h2>
          <div className="mt-3 rounded-lg border border-emerald-300/20 bg-slate-950/50 px-3 py-2 text-cyan-200">{publishedUrl}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyPublicUrl(publishedUrl)} className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs text-cyan-200">Copy link</button>
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white">Open</a>
          </div>
          {placementPageSlug ? <p className="mt-3 text-sm text-emerald-100/80">Placed on /{placementPageSlug}.</p> : null}
          <p className="mt-3 text-xs text-emerald-100/80">Add this link in Navigation, Footer or any page.</p>
          <button type="button" onClick={() => router.push("/studio/forms")} className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">Return to Forms</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Create a form</h2>
        <button type="button" onClick={cancel} disabled={loading} className="text-sm text-slate-300 hover:text-white disabled:opacity-50">Cancel</button>
      </div>
      <div className="space-y-5">
        {success ? (
          publishedUrl ? (
            <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100">
              <div className="font-semibold">{success}</div>
              <div className="mt-2 rounded-lg border border-emerald-300/20 bg-slate-950/50 px-3 py-2 text-cyan-200">{publishedUrl}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyPublicUrl(publishedUrl)} className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs text-cyan-200">Copy link</button>
                <a href={publishedUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white">Open</a>
              </div>
              <p className="mt-3 text-xs text-emerald-100/80">Add this link in Navigation, Footer or any page.</p>
              <button type="button" onClick={() => router.push("/studio/forms")} className="mt-3 text-xs font-semibold text-white underline">Return to Forms</button>
            </div>
          ) : (
            <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</div>
          )
        ) : null}
        {errors.form ? <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{errors.form}</div> : null}
        <div>
          <label htmlFor="form-name" className="mb-2 block text-sm font-semibold text-slate-200">Name <span aria-hidden="true">*</span></label>
          <input id="form-name" value={name} onChange={(event) => updateName(event.target.value)} disabled={loading} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "form-name-error" : undefined} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white" />
          {errors.name ? <p id="form-name-error" className="mt-1 text-xs text-rose-300">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="form-slug" className="mb-2 block text-sm font-semibold text-slate-200">Slug <span aria-hidden="true">*</span></label>
          <input id="form-slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(normalizeSlug(event.target.value)); }} disabled={loading} aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? "form-slug-error" : undefined} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white" />
          <p className="mt-2 text-xs text-cyan-200" aria-label="Public URL preview">Public URL: {slug ? `/forms/${slug}` : "/forms/"}</p>
          {errors.slug ? <p id="form-slug-error" className="mt-1 text-xs text-rose-300">{errors.slug}</p> : null}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-200">Fields</h3><button type="button" onClick={addField} disabled={loading} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200 disabled:opacity-50">Add field</button></div>
          {errors.fields ? <p role="alert" className="mb-2 text-xs text-rose-300">{errors.fields}</p> : null}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={`${index}-${field.key}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">Field {index + 1}</span><div className="flex gap-1">
                  <button type="button" aria-label={`Move ${field.label || "field"} up`} onClick={() => moveField(index, -1)} disabled={loading || index === 0} className="rounded px-2 py-1 text-xs text-slate-300 disabled:opacity-30">↑</button>
                  <button type="button" aria-label={`Move ${field.label || "field"} down`} onClick={() => moveField(index, 1)} disabled={loading || index === fields.length - 1} className="rounded px-2 py-1 text-xs text-slate-300 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => duplicateField(index)} disabled={loading} className="rounded px-2 py-1 text-xs text-cyan-300">Duplicate</button>
                  <button type="button" onClick={() => removeField(index)} disabled={loading} className="rounded px-2 py-1 text-xs text-rose-300">Remove</button>
                </div></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div><label htmlFor={`field-label-${index}`} className="mb-1 block text-xs text-slate-400">Label</label><input id={`field-label-${index}`} value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} disabled={loading} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />{errors[`label_${index}`] ? <p className="mt-1 text-xs text-rose-300">{errors[`label_${index}`]}</p> : null}</div>
                  <div><label htmlFor={`field-key-${index}`} className="mb-1 block text-xs text-slate-400">Key</label><input id={`field-key-${index}`} value={field.key} onChange={(event) => { setKeyEdited((current) => new Set(current).add(index)); updateField(index, { key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }); }} disabled={loading} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />{errors[`key_${index}`] ? <p className="mt-1 text-xs text-rose-300">{errors[`key_${index}`]}</p> : null}</div>
                  <div><label htmlFor={`field-type-${index}`} className="mb-1 block text-xs text-slate-400">Type</label><select id={`field-type-${index}`} value={field.type} onChange={(event) => updateField(index, { type: event.target.value as CmsFormField["type"] })} disabled={loading} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">{fieldTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  <div><label htmlFor={`field-placeholder-${index}`} className="mb-1 block text-xs text-slate-400">Placeholder</label><input id={`field-placeholder-${index}`} value={field.placeholder} onChange={(event) => updateField(index, { placeholder: event.target.value })} disabled={loading} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} disabled={loading} />Required</label>
                {(field.type === "select" || field.type === "radio") ? <div className="mt-3"><label htmlFor={`field-options-${index}`} className="mb-1 block text-xs text-slate-400">Options (one per line)</label><textarea id={`field-options-${index}`} value={(field.options ?? []).join("\n")} onChange={(event) => updateField(index, { options: event.target.value.split(/\n/).map((option) => option.trim()).filter(Boolean) })} disabled={loading} className="min-h-20 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />{errors[`options_${index}`] ? <p className="mt-1 text-xs text-rose-300">{errors[`options_${index}`]}</p> : null}</div> : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-200">Show this form on a page <span className="text-slate-400">(publish only)</span></h3>
          <label htmlFor="placement-page" className="mt-2 block text-xs text-slate-400">Page</label>
          <select id="placement-page" value={placementPageSlug} onChange={(event) => { setPlacementPageSlug(event.target.value); setAfterBlockId(""); }} disabled={loading} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option value="">Don&apos;t place yet</option>
            {pages.map((page) => { const protectedPage = ["home","about","contact","services","blog","docs","faq","subscription","registration"].includes(page.slug); return <option key={page.id} value={page.slug} disabled={protectedPage}>{page.title} ({page.status}){protectedPage ? " — protected system page" : ""}</option>; })}
          </select>
          {placementPageSlug ? (
            <>
              <label htmlFor="placement-position" className="mt-3 block text-xs text-slate-400">Position</label>
              <select id="placement-position" value={placementPosition} onChange={(event) => setPlacementPosition(event.target.value as "top" | "bottom" | "after")} disabled={loading} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="after">After block</option>
              </select>
              {placementPosition === "after" ? (
                <><label htmlFor="after-block" className="mt-3 block text-xs text-slate-400">After block</label><select id="after-block" value={afterBlockId} onChange={(event) => setAfterBlockId(event.target.value)} disabled={loading} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Choose a block</option>{(pages.find((page) => page.slug === placementPageSlug)?.blocks ?? []).map((block, index) => { const title = String(block.props.title ?? block.props.label ?? "Untitled"); return <option key={block.id} value={block.id}>{index + 1}. {block.type} — {title}</option>; })}</select></>
              ) : null}
              {placementPosition === "after" && afterBlockId ? (
                <p className="mt-2 text-xs text-cyan-200">Will appear on /{placementPageSlug}, after {(() => { const block = (pages.find((page) => page.slug === placementPageSlug)?.blocks ?? []).find((entry) => entry.id === afterBlockId); return block ? `${block.type} — ${String(block.props.title ?? block.props.label ?? "Untitled")}` : "the selected block"; })()}.</p>
              ) : <p className="mt-2 text-xs text-cyan-200">Will appear on /{placementPageSlug}, {placementPosition}.</p>}
            </>
          ) : null}
          {errors.placement ? <p role="alert" className="mt-1 text-xs text-rose-300">{errors.placement}</p> : null}
          <p className="mt-2 text-xs text-slate-500">Placement is disabled for Save Draft and applies when you publish.</p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button type="button" onClick={() => save("DRAFT")} disabled={loading} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Saving…" : "Save Draft"}</button>
          <button type="button" onClick={() => save("PUBLISHED")} disabled={loading} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Publishing…" : "Publish"}</button>
        </div>
      </div>
    </div>
  );
}
