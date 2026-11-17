"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

const blocks = [
  { slug: "about", label: "About page", type: "ABOUT_CAPABILITIES" },
  { slug: "values", label: "Values", type: "ABOUT_VALUES" },
  { slug: "commitments", label: "Commitments", type: "ABOUT_COMMITMENTS" },
  { slug: "timeline", label: "Timeline", type: "ABOUT_TIMELINE" },
];

export default function AboutSectionsCmsPage() {
  const [selected, setSelected] = useState("about");
  const [items, setItems] = useState<Array<Record<string, string>>>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/cms/pages?slug=about")
      .then((response) => response.json())
      .then((payload) => {
        const page = payload.page ?? null;
        const blocksArray = Array.isArray(page?.blocks) ? page.blocks : [];
        const matched = blocksArray.find((entry: Record<string, unknown>) => String(entry?.type ?? "").toLowerCase() === selected.toLowerCase()) ?? blocksArray[0];
        const sectionItems = Array.isArray(matched?.props?.items) ? matched.props.items : [];
        setItems(sectionItems);
      })
      .catch(() => setItems([]));
  }, [selected]);

  async function handleCreate() {
    const nextItem = { id: crypto.randomUUID(), title, description };
    const nextItems = [...items, nextItem];
    setItems(nextItems);
    try {
      const selectedBlock = blocks.find((item) => item.slug === selected)?.type ?? "ABOUT_VALUES";
      const response = await fetch("/api/cms/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "about",
          blocks: [{ type: selectedBlock, order: 1, props: { items: nextItems } }],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save about section");
      setTitle("");
      setDescription("");
      setMessage("✅ About section saved");
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save about section");
    }
  }

  return (
    <CmsShell title="About sections CMS" description="Maintain the about page values, commitments, and timeline data from a single admin surface.">
      <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
        <label className="block text-sm text-slate-300">
          <span className="mb-1.5 block text-slate-200">Section</span>
          <select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
            {blocks.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </select>
        </label>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="mt-2 text-sm text-slate-300">{item.description}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              <span className="mb-1.5 block text-slate-200">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-1.5 block text-slate-200">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <button type="button" onClick={handleCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Save section item</button>
            {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div> : null}
            {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
          </div>
        </div>
      </div>
    </CmsShell>
  );
}
