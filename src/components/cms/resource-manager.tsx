"use client";

import Image from "next/image";
import { Search, SlidersHorizontal, SquarePen, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function slugifyResourceValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "image";
  options?: string[];
};

export function SimpleCmsResourceManager({
  title,
  description,
  endpoint,
  defaultItem,
  fields,
  itemName,
  initialItems,
  emptyState,
}: {
  title: string;
  description: string;
  endpoint: string;
  defaultItem: Record<string, string>;
  fields: ResourceField[];
  itemName: string;
  initialItems: Array<Record<string, string>>;
  emptyState?: { title: string; description: string };
}) {
  const [resourceState, setResourceState] = useState({ initialItems, items: initialItems });

  if (resourceState.initialItems !== initialItems) {
    setResourceState({ initialItems, items: initialItems });
  }

  const localItems = resourceState.items;
  const setLocalItems = (items: Array<Record<string, string>>) => {
    setResourceState((current) => ({ ...current, items }));
  };

  const [draft, setDraft] = useState<Record<string, string>>(defaultItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [mediaOptions, setMediaOptions] = useState<Array<{ label: string; value: string; preview: string }>>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let active = true;

    void fetch("/api/media")
      .then((response) => response.json())
      .then((payload) => {
        if (!active) {
          return;
        }

        const itemsList = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
        setMediaOptions(
          itemsList
            .map((mediaItem: Record<string, string>) => ({
              label: String(mediaItem.title ?? mediaItem.name ?? "Media"),
              value: String(mediaItem.url ?? ""),
              preview: String(mediaItem.url ?? ""),
            }))
            .filter((entry: { value: string }) => Boolean(entry.value)),
        );
      })
      .catch(() => {
        if (active) {
          setMediaOptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const emptyDraft = useMemo(() => defaultItem, [defaultItem]);
  const emptyStateContent = emptyState ?? {
    title: `No matching ${itemName.toLowerCase()}s`,
    description: "Try changing your filters or create a new record to get started.",
  };
  const pageSize = 6;

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return localItems.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || String(item.status ?? "DRAFT").toUpperCase() === statusFilter;
      const text = Object.values(item).join(" ").toLowerCase();
      const matchesSearch = !query || text.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [localItems, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const resetPagination = () => setPage(1);

  async function handleDelete(id: string) {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Delete failed");
      }

      const nextItems = Array.isArray(data?.items) ? data.items : localItems.filter((item) => item.id !== id);
      setLocalItems(nextItems);
      if (editingId === id) {
        setDraft(emptyDraft);
        setEditingId(null);
      }
      setMessage("✅ Resource deleted");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "❌ Delete failed");
    }
  }

  function updateDraft(key: string, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      const titleKey = Object.prototype.hasOwnProperty.call(next, "title") ? "title" : Object.prototype.hasOwnProperty.call(next, "question") ? "question" : null;

      if (!editingId && titleKey === key && Object.prototype.hasOwnProperty.call(next, "slug")) {
        const oldSlug = slugifyResourceValue(String(current.title ?? current.question ?? ""));
        if (!next.slug || next.slug === oldSlug) {
          next.slug = slugifyResourceValue(value);
        }
      }

      return next;
    });
  }

  async function handleDeviceUpload(fieldKey: string, file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title || itemName} ${fieldKey}`,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          url: dataUrl,
          altText: `${itemName} image`,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Image upload failed");
      }

      const mediaUrl = String(payload?.media?.url ?? dataUrl);
      updateDraft(fieldKey, mediaUrl);
      setMessage("✅ Image uploaded successfully");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "❌ Image upload failed");
    }
  }

  const statusOptions = ["ALL", "DRAFT", "PUBLISHED"];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let focusTimer: number | undefined;

    const revealCreateForm = () => {
      if (window.location.hash !== "#create-resource-form") {
        return;
      }

      const frame = window.requestAnimationFrame(() => {
        const form = document.getElementById("create-resource-form");
        form?.scrollIntoView({ behavior: "smooth", block: "start" });

        const titleInput = form?.querySelector<HTMLInputElement>('input[name="title"]')
          ?? form?.querySelector<HTMLInputElement>('input[type="text"]');
        focusTimer = window.setTimeout(() => titleInput?.focus(), 100);
      });

      return frame;
    };

    const frame = revealCreateForm();
    window.addEventListener("hashchange", revealCreateForm);
    window.addEventListener("phause:create-service-open", revealCreateForm);

    return () => {
      window.removeEventListener("hashchange", revealCreateForm);
      window.removeEventListener("phause:create-service-open", revealCreateForm);
      if (typeof frame === "number") window.cancelAnimationFrame(frame);
      if (typeof focusTimer === "number") window.clearTimeout(focusTimer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-cyan-300">
            {localItems.length} records
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-semibold text-white">Records</h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    resetPagination();
                  }}
                  placeholder="Search records..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60 sm:w-56"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    resetPagination();
                  }}
                  className="appearance-none rounded-xl border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-8 text-sm text-white outline-none focus:border-cyan-500/60"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status === "ALL" ? "All status" : status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="rounded-full border border-dashed border-slate-700 bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  Empty state
                </div>
                <div className="text-lg font-semibold text-white">{emptyStateContent.title}</div>
                <div className="max-w-sm text-sm text-slate-400">{emptyStateContent.description}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Slug</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => {
                      const label = item.title || item.question || item.name || "Untitled";
                      const status = String(item.status ?? "DRAFT").toUpperCase();
                      return (
                        <tr key={item.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{label}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{item.slug || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${status === "PUBLISHED" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-amber-500/25 bg-amber-500/10 text-amber-200"}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => { setEditingId(item.id ?? null); setDraft(item); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:border-cyan-500/40 hover:text-cyan-300">
                                <SquarePen size={12} />
                                Edit
                              </button>
                              <button type="button" onClick={() => handleDelete(String(item.id ?? ""))} className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20">
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredItems.length > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Prev
                </button>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <form
          id="create-resource-form"
          action="/api/cms/services"
          method="post"
          className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6"
        >
          <h3 className="text-xl font-semibold text-white">{editingId ? "Edit" : "Create"} {itemName}</h3>
          <p className="mt-1 text-sm text-slate-400">Complete the details below and save to push updates live.</p>

          <div className="mt-5 space-y-4">
            {fields.map((field) => {
              if (field.type === "image") {
                const selectedImage = draft[field.key] ?? "";
                const selectedPreview = mediaOptions.find((option) => option.value === selectedImage)?.preview ?? selectedImage;

                return (
                  <div key={field.key} className="block text-sm text-slate-300">
                    <span className="mb-1.5 block text-slate-200">{field.label}</span>

                    <div className="space-y-3">
                      {selectedPreview ? (
                        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
                          <Image src={selectedPreview} alt={field.label} width={1200} height={700} className="h-24 w-full rounded-lg object-cover" />
                        </div>
                      ) : null}

                      <select
                        name={field.key}
                        value={selectedImage}
                        onChange={(event) => updateDraft(field.key, event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500/60"
                      >
                        <option value="">Choose from media library</option>
                        {mediaOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>

                      <div className="flex gap-3">
                        <input
                          ref={(input) => {
                            fileInputRefs.current[field.key] = input;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleDeviceUpload(field.key, file);
                              event.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[field.key]?.click()}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                        >
                          <Upload size={15} />
                          Upload from device
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <label key={field.key} className="block text-sm text-slate-300">
                  <span className="mb-1.5 block text-slate-200">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.key}
                      value={draft[field.key] ?? ""}
                      onChange={(event) => updateDraft(field.key, event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
                    />
                  ) : field.type === "number" ? (
                    <input
                      name={field.key}
                      type="number"
                      value={draft[field.key] ?? "0"}
                      onChange={(event) => updateDraft(field.key, event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500/60"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={draft[field.key] ?? ""}
                      onChange={(event) => updateDraft(field.key, event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-cyan-500/60"
                    >
                      <option value="">Select</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type="text"
                      value={draft[field.key] ?? ""}
                      onChange={(event) => updateDraft(field.key, event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={isSaving} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "Saving..." : editingId ? "Save changes" : `Create ${itemName}`}
            </button>
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); }} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200">
                Cancel
              </button>
            ) : null}
          </div>

          {message ? <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
        </form>
      </div>
    </div>
  );
}

export function GenericCmsResourceCreator() {
  const types = [
    "Page",
    "Blog Post",
    "FAQ",
    "Doc",
    "Service",
    "Testimonial",
    "Navigation Item",
    "Footer Link",
  ];

  const [selected, setSelected] = useState(types[0]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setMessage(null);
    setError(null);

    const slugValue = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    try {
      let endpoint = "/api/cms/pages";
      const payload: Record<string, string> = {
        title,
        slug: slugValue,
      };

      if (selected === "Blog Post") endpoint = "/api/cms/blog";
      if (selected === "FAQ") endpoint = "/api/cms/faqs";
      if (selected === "Doc") endpoint = "/api/cms/pages";
      if (selected === "Service") endpoint = "/api/cms/services";
      if (selected === "Testimonial") endpoint = "/api/cms/testimonials";
      if (selected === "Navigation Item") endpoint = "/api/cms/navigation";
      if (selected === "Footer Link") endpoint = "/api/cms/footer";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          type: selected,
          status: selected === "Blog Post" ? "PUBLISHED" : "DRAFT",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Create failed");
      }

      setMessage(`✅ ${selected} created successfully`);
      setTitle("");
      setSlug("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "❌ Save failed");
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
      <h2 className="text-2xl font-semibold text-white">[ + Create Resource ]</h2>
      <p className="mt-2 text-sm text-slate-400">Create page, blog, FAQ, doc, service, testimonial, navigation, or footer items without editing code.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-300">
          <span className="mb-1.5 block text-slate-200">Type</span>
          <select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-1.5 block text-slate-200">Title</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>

        <label className="block text-sm text-slate-300 md:col-span-2">
          <span className="mb-1.5 block text-slate-200">Slug</span>
          <input type="text" value={slug} onChange={(event) => setSlug(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" placeholder="auto-generated from title" />
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={handleCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Create resource</button>
      </div>

      {message ? <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div> : null}
      {error ? <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
    </div>
  );
}
