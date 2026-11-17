"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

type BlogImageField = {
  id: string;
  url: string;
  altText: string;
  mimeType: string;
  size: number;
  title?: string;
};

type BlogFormState = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: "DRAFT" | "PUBLISHED";
  imageAlt: string;
  featuredImage: BlogImageField | null;
  thumbnailImage: BlogImageField | null;
  ogImage: BlogImageField | null;
};

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const emptyForm: BlogFormState = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  status: "DRAFT",
  imageAlt: "",
  featuredImage: null,
  thumbnailImage: null,
  ogImage: null,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function validateImageFile(file: File, fieldName: string) {
  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error(`❌ Invalid image format for ${fieldName}`);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`❌ File exceeds 10MB for ${fieldName}`);
  }
}

function getImageDataFromMedia(media: Record<string, unknown>) {
  return {
    id: String(media.id ?? ""),
    url: String(media.url ?? ""),
    altText: String(media.altText ?? media.title ?? ""),
    mimeType: String(media.mimeType ?? "image/png"),
    size: Number(media.size ?? 0),
    title: String(media.title ?? ""),
  } as BlogImageField;
}

function ImageUploadField({
  label,
  value,
  onUpload,
  onSelectFromLibrary,
  onClear,
}: {
  label: string;
  value: BlogImageField | null;
  onUpload: (file: File) => Promise<void>;
  onSelectFromLibrary: () => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    try {
      validateImageFile(file, label);
      await onUpload(file);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `❌ Invalid image for ${label}`);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        <div className="flex gap-2 text-xs">
          <button type="button" className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800" onClick={() => inputRef.current?.click()}>
            Upload
          </button>
          <button type="button" className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800" onClick={onSelectFromLibrary}>
            Select from Media Library
          </button>
          {value && (
            <button type="button" className="rounded-md border border-red-600 px-2 py-1 text-red-200 hover:bg-red-950/40" onClick={onClear}>
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={(event) => void handleFiles(event.target.files)} />

      <div
        className={`relative flex min-h-44 items-center justify-center overflow-hidden rounded-lg border border-dashed ${isDragging ? "border-cyan-400 bg-cyan-950/20" : "border-slate-600 bg-slate-900/60"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        {value?.url ? (
          <div className="w-full p-3">
            <Image src={value.url} alt={value.altText || label} width={1200} height={800} className="h-32 w-full rounded-md object-cover" />
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-300">
              <span>{value.title || value.altText || label}</span>
              <button type="button" className="rounded-md border border-slate-600 px-2 py-1 hover:bg-slate-800" onClick={() => window.open(value.url, "_blank", "noopener,noreferrer")}>
                Preview
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-400">
            <p>Drag & drop an image here</p>
            <p className="mt-1">or click upload</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function BlogCmsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [library, setLibrary] = useState<Array<Record<string, unknown>>>([]);
  const [libraryField, setLibraryField] = useState<keyof Pick<BlogFormState, "featuredImage" | "thumbnailImage" | "ogImage"> | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedItems = useMemo(() => [...items].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))), [items]);

  async function loadPosts() {
    const response = await fetch("/api/cms/blog");
    const payload = await parseJsonResponse<{ items?: Array<Record<string, unknown>>; success?: boolean; message?: string }>(response);

    if (!response.ok || !payload || !payload.success) {
      setItems([]);
      if (payload?.message) {
        setError(payload.message);
      }
      return;
    }

    setItems(Array.isArray(payload.items) ? payload.items : []);
    setError(null);
  }

  async function loadLibrary() {
    const response = await fetch("/api/media");
    const payload = await parseJsonResponse<{ media?: Array<Record<string, unknown>>; success?: boolean; message?: string }>(response);

    if (!response.ok || !payload || !payload.success) {
      setLibrary([]);
      if (payload?.message) {
        setError(payload.message);
      }
      return;
    }

    setLibrary(Array.isArray(payload.media) ? payload.media : []);
  }

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await fetch("/api/cms/blog");
        const payload = await parseJsonResponse<{ items?: Array<Record<string, unknown>>; success?: boolean; message?: string }>(response);

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload || !payload.success) {
          setItems([]);
          if (payload?.message) {
            setError(payload.message);
          }
          return;
        }

        setItems(Array.isArray(payload.items) ? payload.items : []);
        setError(null);
      } catch {
        if (isMounted) {
          setItems([]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const savePost = async () => {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      featuredImage: form.featuredImage ? { ...form.featuredImage, id: form.featuredImage.id || undefined } : null,
      thumbnailImage: form.thumbnailImage ? { ...form.thumbnailImage, id: form.thumbnailImage.id || undefined } : null,
      ogImage: form.ogImage ? { ...form.ogImage, id: form.ogImage.id || undefined } : null,
    };

    try {
      const response = await fetch("/api/cms/blog", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !data || !data.success) {
        throw new Error(data?.message || "Unable to save blog post");
      }

      setMessage(data.message || "✅ Blog post saved");
      setError(null);
      setForm(emptyForm);
      await loadPosts();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save blog post");
      setMessage(null);
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch("/api/cms/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = await parseJsonResponse<{ success?: boolean; message?: string }>(response);
    if (!response.ok || !payload || !payload.success) {
      setError(payload?.message || "Unable to delete post");
      return;
    }

    setMessage("✅ Blog post deleted");
    setError(null);
    setForm(emptyForm);
    await loadPosts();
  };

  const handleImageUpload = async (fieldName: keyof Pick<BlogFormState, "featuredImage" | "thumbnailImage" | "ogImage">, file: File) => {
    validateImageFile(file, String(fieldName));

    const dataUrl = await toDataUrl(file);
    const response = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${form.title || "Blog"} ${fieldName}`,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        url: dataUrl,
        altText: form.imageAlt || form.title || `${fieldName} image`,
      }),
    });

    const payload = await parseJsonResponse<{ success?: boolean; message?: string; media?: Record<string, unknown> }>(response);
    if (!response.ok || !payload || !payload.success) {
      throw new Error(payload?.message || "Media upload failed");
    }

    const media = getImageDataFromMedia(payload.media ?? {});
    setForm((current) => ({
      ...current,
      [fieldName]: media,
    }));
    setMessage("✅ Image uploaded successfully");
    setError(null);
  };

  const selectFromLibrary = (fieldName: keyof Pick<BlogFormState, "featuredImage" | "thumbnailImage" | "ogImage">) => {
    void loadLibrary();
    setLibraryField(fieldName);
    setShowLibrary(true);
  };

  return (
    <CmsShell title="Blog CMS" description="Create, edit, and remove posts that power the public blog feed and article routes.">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">{form.id ? "Edit post" : "Create post"}</h2>
              <p className="text-sm text-slate-400">Every saved story becomes available at /blog/[slug] automatically.</p>
            </div>
            <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" onClick={() => setForm(emptyForm)}>
              New post
            </button>
          </div>

          {message && <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-200">{message}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</div>}

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title: nextTitle,
                      slug: current.slug || slugify(nextTitle),
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500"
                  placeholder="AI-powered service delivery"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                  placeholder="ai-powered-service-delivery"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "DRAFT" | "PUBLISHED" }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Excerpt</span>
              <textarea
                value={form.excerpt}
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                placeholder="Brief summary for the listing card and metadata."
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Image Alt Text</span>
              <input
                value={form.imageAlt}
                onChange={(event) => setForm((current) => ({ ...current, imageAlt: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                placeholder="Team reviewing a service dashboard"
              />
            </label>

            <div className="space-y-4">
              <ImageUploadField
                label="Featured Image"
                value={form.featuredImage}
                onUpload={(file) => handleImageUpload("featuredImage", file)}
                onSelectFromLibrary={() => {
                  selectFromLibrary("featuredImage");
                }}
                onClear={() => setForm((current) => ({ ...current, featuredImage: null }))}
              />
              <ImageUploadField
                label="Thumbnail Image"
                value={form.thumbnailImage}
                onUpload={(file) => handleImageUpload("thumbnailImage", file)}
                onSelectFromLibrary={() => {
                  selectFromLibrary("thumbnailImage");
                }}
                onClear={() => setForm((current) => ({ ...current, thumbnailImage: null }))}
              />
              <ImageUploadField
                label="OG Image"
                value={form.ogImage}
                onUpload={(file) => handleImageUpload("ogImage", file)}
                onSelectFromLibrary={() => {
                  selectFromLibrary("ogImage");
                }}
                onClear={() => setForm((current) => ({ ...current, ogImage: null }))}
              />
            </div>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Body</span>
              <textarea
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                className="min-h-72 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                placeholder="Write the article body here..."
              />
            </label>

            <button type="button" onClick={() => void savePost()} className="rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 hover:bg-cyan-400">
              {form.id ? "Save changes" : "Create post"}
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Existing posts</h3>
            <span className="text-xs text-slate-400">{sortedItems.length} total</span>
          </div>

          <div className="space-y-3">
            {sortedItems.length === 0 ? (
              <p className="text-sm text-slate-400">No posts yet.</p>
            ) : (
              sortedItems.map((item) => (
                <div key={String(item.id ?? "") } className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{String(item.title ?? "Untitled")}</p>
                      <p className="text-xs text-slate-400">/{String(item.slug ?? "untitled")}</p>
                    </div>
                    <span className="rounded-full border border-slate-600 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">{String(item.status ?? "DRAFT")}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800" onClick={() => setForm({
                      id: String(item.id ?? ""),
                      title: String(item.title ?? ""),
                      slug: String(item.slug ?? ""),
                      excerpt: String(item.excerpt ?? ""),
                      body: String(item.body ?? ""),
                      status: String(item.status ?? "DRAFT") as "DRAFT" | "PUBLISHED",
                      imageAlt: String(item.imageAlt ?? String(item.title ?? "")),
                      featuredImage: item.featuredImage ? getImageDataFromMedia(item.featuredImage as Record<string, unknown>) : null,
                      thumbnailImage: item.thumbnailImage ? getImageDataFromMedia(item.thumbnailImage as Record<string, unknown>) : null,
                      ogImage: item.ogImage ? getImageDataFromMedia(item.ogImage as Record<string, unknown>) : null,
                    })}>
                      Edit
                    </button>
                    <button type="button" className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-200 hover:bg-red-950/40" onClick={() => void handleDelete(String(item.id ?? ""))}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Media Library</h3>
              <button type="button" className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800" onClick={() => setShowLibrary(false)}>
                Close
              </button>
            </div>
            <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
              {library.length === 0 ? (
                <p className="col-span-full text-sm text-slate-400">No media assets yet.</p>
              ) : (
                library.map((media) => {
                  const entry = media as Record<string, unknown>;
                  const image = getImageDataFromMedia(entry);
                  return (
                    <button type="button" key={String(entry.id ?? image.url)} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-left hover:border-cyan-500" onClick={() => {
                      if (!libraryField) {
                        setShowLibrary(false);
                        return;
                      }

                      setForm((current) => ({
                        ...current,
                        [libraryField]: image,
                      }));
                      setShowLibrary(false);
                    }}>
                      <Image src={String(entry.url ?? "")} alt={String(entry.altText ?? entry.title ?? "")} width={1200} height={700} className="h-28 w-full object-cover" />
                      <div className="p-3 text-sm text-slate-200">
                        <div className="font-medium">{String(entry.title ?? "Media asset")}</div>
                        <div className="mt-1 text-xs text-slate-400">{String(entry.mimeType ?? "image")}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </CmsShell>
  );
}
