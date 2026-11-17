"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

export default function DocsCmsPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/cms/pages?slug=docs")
      .then((response) => response.json())
      .then((payload) => {
        const page = payload.page ?? null;
        const blocks = Array.isArray(page?.blocks) ? page.blocks : [];
        const block = blocks.find((entry: Record<string, unknown>) => entry?.type === "CUSTOM_SECTION");
        const docs = Array.isArray(block?.props?.items) ? block.props.items : [];
        setItems(docs);
      })
      .catch(() => setItems([]));
  }, []);

  async function handleCreate() {
    const nextItem = { id: crypto.randomUUID(), title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), description };
    const nextItems = [...items, nextItem];
    setItems(nextItems);

    try {
      const response = await fetch("/api/cms/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "docs", blocks: [{ type: "CUSTOM_SECTION", order: 1, props: { items: nextItems } }] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save docs");
      setTitle("");
      setSlug("");
      setDescription("");
      setMessage("✅ Documentation item saved");
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save docs");
    }
  }

  return (
    <CmsShell title="Docs CMS" description="Keep documentation entries in the CMS and use them as the canonical source for docs content.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
          <h3 className="text-xl font-semibold text-white">Documentation entries</h3>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">No docs yet.</div> : items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-xs text-slate-400">/{item.slug || "doc"}</div>
                <div className="mt-2 text-sm text-slate-300">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
          <h3 className="text-xl font-semibold text-white">Add a document</h3>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">
              <span className="mb-1.5 block text-slate-200">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-1.5 block text-slate-200">Slug</span>
              <input value={slug} onChange={(event) => setSlug(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="Auto-generated from title" />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-1.5 block text-slate-200">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            </label>
          </div>

          <button type="button" onClick={handleCreate} className="mt-6 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Save document</button>
          {message ? <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
        </div>
      </div>
    </CmsShell>
  );
}
