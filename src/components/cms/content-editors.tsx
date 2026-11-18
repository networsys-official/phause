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

type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: string;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    canonical?: string | null;
  };
  blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>;
};

type NavigationItem = { label: string; href: string; position: number };

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

export function PageSectionEditor({ page, blocks, media }: { page: { id: string; slug: string; title: string; status: string }; blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>; media: Array<{ id: string; title: string; url: string; mimeType: string }> }) {
  const router = useRouter();
  const initialSectionsRef = useRef(blocks.map((block) => normalizeBlockRecord(block)));
  const [sections, setSections] = useState(() => blocks.map((block) => normalizeBlockRecord(block)));
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "info" | "warning" | "error"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateSection = (id: string, field: string, value: string | boolean | number) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              props: {
                ...section.props,
                [field]: value,
              },
            }
          : section,
      ),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const updateContactDetail = (id: string, detailIndex: number, field: "label" | "value" | "note", value: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextDetails = serializeContactDetails(section.props.details);
        nextDetails[detailIndex] = {
          ...nextDetails[detailIndex],
          id: nextDetails[detailIndex]?.id ?? `contact-detail-${detailIndex + 1}`,
          [field]: value,
        };

        return {
          ...section,
          props: {
            ...section.props,
            details: nextDetails,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const updateSectionItem = (id: string, itemIndex: number, field: string, value: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextItems = normalizeEditableSectionItems(String(section.type ?? ""), section.props.items).map((item, index) => {
          if (index !== itemIndex) return item;
          return { ...item, [field]: value };
        });

        return {
          ...section,
          props: {
            ...section.props,
            items: nextItems,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const addSectionItem = (id: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextItems = normalizeEditableSectionItems(String(section.type ?? ""), section.props.items);
        const isFaq = String(section.type ?? "").toLowerCase() === "faq";
        nextItems.push({
          id: `item-${nextItems.length + 1}`,
          title: isFaq ? "New question" : "New item",
          description: isFaq ? "Add answer" : "Add description",
          question: isFaq ? "New question" : "",
          answer: isFaq ? "Add answer" : "",
          icon: "",
        });

        return {
          ...section,
          props: {
            ...section.props,
            items: nextItems,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const removeSectionItem = (id: string, itemIndex: number) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextItems = normalizeEditableSectionItems(String(section.type ?? ""), section.props.items).filter((_, index) => index !== itemIndex);
        return {
          ...section,
          props: {
            ...section.props,
            items: nextItems,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const addContactDetail = (id: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextDetails = serializeContactDetails(section.props.details);
        nextDetails.push({
          id: `contact-detail-${nextDetails.length + 1}`,
          label: `Detail ${nextDetails.length + 1}`,
          value: "",
          note: "",
        });

        return {
          ...section,
          props: {
            ...section.props,
            details: nextDetails,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const removeContactDetail = (id: string, detailIndex: number) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;

        const nextDetails = serializeContactDetails(section.props.details);
        nextDetails.splice(detailIndex, 1);

        return {
          ...section,
          props: {
            ...section.props,
            details: nextDetails,
          },
        };
      }),
    );
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((section, idx) => ({ ...section, order: idx, props: { ...section.props, order: idx, position: idx } }));
    });
    setHasUnsavedChanges(true);
    setMessage("");
  };

  const validateSections = (list: typeof sections) => {
    const nextErrors: Record<string, Record<string, string>> = {};

    list.forEach((section) => {
      const sectionErrors = validatePageSectionProps(section, list, media.map((item) => item.url));

      if (Object.keys(sectionErrors).length > 0) {
        nextErrors[section.id] = sectionErrors;
      }
    });

    if (detectDuplicatePosition(list.map((section) => ({ id: section.id, position: section.props.position ?? section.order })))) {
      const duplicatePositionMessage = "⚠️ Duplicate position found";
      setSaveState("error");
      setToast({ type: "warning", message: duplicatePositionMessage });
      setMessage("⚠️ Position already exists.");
      return nextErrors;
    }

    return nextErrors;
  };

  const save = async () => {
    const nextErrors = validateSections(sections);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveState("error");
      setToast({ type: "error", message: "❌ Save failed" });
      setMessage("❌ Failed to save changes.");
      return;
    }

    if (!hasPageChanges(sections, initialSectionsRef.current)) {
      setSaveState("idle");
      setToast({ type: "info", message: "ℹ️ No changes detected" });
      setMessage("ℹ️ No changes detected.");
      return;
    }

    setIsLoading(true);
    setSaveState("saving");
    setMessage("");

    try {
      const payload = {
        slug: page.slug,
        title: page.title,
        status: page.status,
        seo: {
          title: page.title,
          description: "Managed via CMS",
        },
        blocks: sections
          .map((section, index) => ({
            id: section.id,
            type: String(section.type ?? "").toLowerCase(),
            order: index,
            props: {
              ...section.props,
              position: Number(section.props.position ?? index),
              visibility: section.props.visibility !== false,
              title: typeof section.props.title === "string" ? section.props.title : "",
              subtitle: typeof section.props.subtitle === "string" ? section.props.subtitle : "",
              description: typeof section.props.description === "string" ? section.props.description : "",
              buttonText: typeof section.props.buttonText === "string" ? section.props.buttonText : typeof section.props.ctaPrimary === "string" ? section.props.ctaPrimary : "",
              buttonLink: typeof section.props.buttonLink === "string" ? section.props.buttonLink : typeof section.props.ctaPrimaryHref === "string" ? section.props.ctaPrimaryHref : "",
              image: typeof section.props.image === "string" ? section.props.image : "",
              details: section.type === "contact" ? serializeContactDetails(section.props.details) : section.props.details,
            },
          }))
          .sort((left, right) => left.order - right.order),
      };

      await requestJson("/api/cms/pages", "PUT", payload);
      window.localStorage.setItem("phause:cms-page-updated", String(Date.now()));
      setSaveState("success");
      setHasUnsavedChanges(false);
      initialSectionsRef.current = sections.map((section) => ({ ...section }));
      setMessage("✅ Changes saved successfully.");
      setToast({ type: "success", message: "✅ Home page updated successfully" });
      router.refresh();
    } catch (error) {
      setSaveState("error");
      setToast({ type: "error", message: "❌ Save failed" });
      setMessage(error instanceof Error ? error.message : "❌ Failed to save changes.");
    } finally {
      setIsLoading(false);
      window.setTimeout(() => setSaveState("idle"), 1800);
    }
  };

  const leaveWithoutSaving = () => {
    setHasUnsavedChanges(false);
    setShowLeaveDialog(false);
    router.refresh();
  };

  const safeButtonClasses = "save-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      {showLeaveDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">You have unsaved changes.</h3>
            <p className="mt-2 text-sm text-slate-300">Do you want to leave without saving?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowLeaveDialog(false)} className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-cyan-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" aria-label="Stay on this page">Stay</button>
              <button type="button" onClick={leaveWithoutSaving} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" aria-label="Discard changes and leave">Discard Changes</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Page sections</h2>
            <p className="text-sm text-slate-400">Configure block content, visibility, ordering, and image assets.</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={isLoading}
            aria-label={saveState === "saving" ? "Saving page sections" : "Save all sections"}
            aria-busy={isLoading}
            className={cn(
              safeButtonClasses,
              isLoading ? "cursor-wait" : "cursor-pointer",
            )}
          >
            {isLoading || saveState === "saving" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" aria-hidden="true" />
                <span>Saving...</span>
              </>
            ) : saveState === "success" ? (
              <>
                <span aria-hidden="true">✓</span>
                <span>Saved successfully</span>
              </>
            ) : saveState === "error" ? (
              <>
                <span aria-hidden="true">↻</span>
                <span>Try again</span>
              </>
            ) : (
              <span>Save all sections</span>
            )}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center text-slate-400">
          No sections available yet. Add a section to start editing content.
        </div>
      ) : null}

      {sections.map((section, index) => (
        <div key={section.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{section.type}</div>
              <h3 className="mt-1 text-lg font-bold text-white">Section {index + 1}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label={`Move section ${index + 1} up`} onClick={() => moveSection(index, -1)} className="rounded-full border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">↑</button>
              <button type="button" aria-label={`Move section ${index + 1} down`} onClick={() => moveSection(index, 1)} className="rounded-full border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 transition-all duration-200 hover:border-cyan-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">↓</button>
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={section.props.visibility !== false}
                  onChange={(event) => updateSection(section.id, "visibility", event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/10 text-cyan-400"
                  aria-label={`Toggle visibility for section ${index + 1}`}
                />
                Visible
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300 md:col-span-1">
              <span className="mb-1 block font-medium text-white">Title</span>
              <input value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
              {errors[section.id]?.title ? <span className="mt-1 block text-xs text-rose-400">{errors[section.id].title}</span> : null}
            </label>

            <label className="block text-sm text-slate-300 md:col-span-1">
              <span className="mb-1 block font-medium text-white">Subtitle</span>
              <input value={String(section.props.subtitle ?? "")} onChange={(event) => updateSection(section.id, "subtitle", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Subtitle for section ${index + 1}`} />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-1 block font-medium text-white">Description</span>
              <textarea value={String(section.props.description ?? "")} onChange={(event) => updateSection(section.id, "description", event.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Description for section ${index + 1}`} />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-1">
              <span className="mb-1 block font-medium text-white">Button text</span>
              <input value={String(section.props.buttonText ?? "")} onChange={(event) => updateSection(section.id, "buttonText", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-1">
              <span className="mb-1 block font-medium text-white">Button link</span>
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button link for section ${index + 1}`} />
              {errors[section.id]?.buttonLink ? <span className="mt-1 block text-xs text-rose-400">{errors[section.id].buttonLink}</span> : null}
            </label>

            {Array.isArray(section.props.items) || ["homephilosophy", "homereasons", "homeservices", "homeoffers", "homeprocess", "faq", "testimonials", "stats", "pricing", "team"].includes(String(section.type ?? "").toLowerCase()) ? (
              <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Editable items</div>
                    <p className="text-xs text-slate-400">Edit each card, row, or FAQ entry in this section.</p>
                  </div>
                  <button type="button" onClick={() => addSectionItem(section.id)} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/15">Add item</button>
                </div>

                <div className="space-y-3">
                  {normalizeEditableSectionItems(String(section.type ?? ""), section.props.items).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/80 p-3 text-sm text-slate-400">No items yet. Add one to start editing this section.</div>
                  ) : null}

                  {normalizeEditableSectionItems(String(section.type ?? ""), section.props.items).map((item, itemIndex) => {
                    const isFaq = String(section.type ?? "").toLowerCase() === "faq";
                    const titleValue = String(item.title ?? item.question ?? item.label ?? "");
                    const descriptionValue = String(item.description ?? item.answer ?? item.value ?? item.text ?? "");

                    return (
                      <div key={String(item.id ?? `item-${itemIndex + 1}`)} className="rounded-xl border border-white/10 bg-slate-900 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-xs uppercase tracking-[0.18em] text-cyan-300">Item {itemIndex + 1}</span>
                          <button type="button" onClick={() => removeSectionItem(section.id, itemIndex)} className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-200">Remove</button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {!isFaq ? (
                            <label className="block text-xs text-slate-300 md:col-span-1">
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Title</span>
                              <input value={titleValue} onChange={(event) => updateSectionItem(section.id, itemIndex, "title", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                            </label>
                          ) : (
                            <label className="block text-xs text-slate-300 md:col-span-1">
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Question</span>
                              <input value={String(item.question ?? "")} onChange={(event) => updateSectionItem(section.id, itemIndex, "question", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                            </label>
                          )}

                          {!isFaq ? (
                            <label className="block text-xs text-slate-300 md:col-span-1">
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Icon</span>
                              <input value={String(item.icon ?? "")} onChange={(event) => updateSectionItem(section.id, itemIndex, "icon", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" placeholder="shield, eye, lock" />
                            </label>
                          ) : null}

                          {!isFaq ? (
                            <label className="block text-xs text-slate-300 md:col-span-2">
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Description</span>
                              <textarea value={descriptionValue} onChange={(event) => updateSectionItem(section.id, itemIndex, "description", event.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                            </label>
                          ) : (
                            <label className="block text-xs text-slate-300 md:col-span-2">
                              <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Answer</span>
                              <textarea value={String(item.answer ?? "")} onChange={(event) => updateSectionItem(section.id, itemIndex, "answer", event.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {String(section.type ?? "").toLowerCase() === "contact" ? (
              <div className="md:col-span-2 rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Contact details</div>
                    <p className="text-xs text-slate-400">Email, phone, office, and working hours</p>
                  </div>
                  <button type="button" onClick={() => addContactDetail(section.id)} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/15">Add item</button>
                </div>

                <div className="space-y-3">
                  {serializeContactDetails(section.props.details).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/80 p-3 text-sm text-slate-400">No contact details yet. Add a new card to start editing.</div>
                  ) : null}

                  {serializeContactDetails(section.props.details).map((detail, detailIndex) => (
                    <div key={detail.id || `${section.id}-detail-${detailIndex}`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-900 p-3 md:grid-cols-[1fr_1.5fr_1.5fr_auto]">
                      <label className="block text-xs text-slate-300">
                        <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Label</span>
                        <input value={detail.label} onChange={(event) => updateContactDetail(section.id, detailIndex, "label", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                      </label>

                      <label className="block text-xs text-slate-300">
                        <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Value</span>
                        <input value={detail.value} onChange={(event) => updateContactDetail(section.id, detailIndex, "value", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                      </label>

                      <label className="block text-xs text-slate-300">
                        <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Note</span>
                        <input value={detail.note} onChange={(event) => updateContactDetail(section.id, detailIndex, "note", event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
                      </label>

                      <button type="button" onClick={() => removeContactDetail(section.id, detailIndex)} className="self-end rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition-all duration-200 hover:bg-red-500/15">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block text-sm text-slate-300 md:col-span-1">
              <span className="mb-1 block font-medium text-white">Position</span>
              <input type="number" value={Number(section.props.position ?? index)} onChange={(event) => updateSection(section.id, "position", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Position for section ${index + 1}`} />
              {errors[section.id]?.position ? <span className="mt-1 block text-xs text-rose-400">{errors[section.id].position}</span> : null}
            </label>
          </div>
        </div>
      ))}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast ? toast.message : ""}
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : toast.type === "info"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                : toast.type === "warning"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {message ? <div className="text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function PagesEditor({ pages }: { pages: PageRecord[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ id: "", title: "", slug: "", status: "DRAFT" as "DRAFT" | "PUBLISHED" });
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const method = draft.id ? "PUT" : "POST";
      const payload = {
        id: draft.id || undefined,
        slug: normalizeSlug(draft.slug || draft.title),
        title: draft.title,
        status: draft.status,
        blocks: [],
        seo: {
          title: draft.title,
          description: "Edited via CMS",
        },
      };

      await requestJson("/api/cms/pages", method, payload);
      setMessage("Page saved successfully.");
      setDraft({ id: "", title: "", slug: "", status: "DRAFT" });
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Page save failed.");
    }
  };

  const onDelete = async (page: PageRecord) => {
    if (!confirmDeleteAction(`page "${page.title}"`)) {
      return;
    }

    try {
      await requestJson("/api/cms/pages", "DELETE", { slug: page.slug });
      setMessage(`Deleted page ${page.title}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Page list</h2>
        <div className="mt-4 space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
              <div>
                <div className="font-semibold text-white">{page.title}</div>
                <div className="text-sm text-cyan-300">/{page.slug}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/cms/pages/${page.slug}`)}
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(page)}
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">{draft.id ? "Edit page" : "Add page"}</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-slate-300">
            Title
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              placeholder="Page title"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Slug
            <input
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              placeholder="page-slug"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Status
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as "DRAFT" | "PUBLISHED" }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>

          <button type="submit" className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
            {draft.id ? "Save page" : "Create page"}
          </button>

          {message ? <div className="text-sm text-cyan-200">{message}</div> : null}
        </div>
      </form>
    </div>
  );
}

export function NavigationEditor({ navigation }: { navigation: { key: string; label: string; items: NavigationItem[] } }) {
  const router = useRouter();
  const [items, setItems] = useState<NavigationItem[]>(navigation.items);
  const [draft, setDraft] = useState({ label: "", href: "" });
  const [message, setMessage] = useState("");

  const save = async () => {
    try {
      await requestJson("/api/navigation", "PUT", { key: navigation.key, label: navigation.label, items });
      setMessage("Navigation saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Navigation save failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Main navigation</h2>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
              <div>
                <div className="font-medium text-white">{item.label}</div>
                <div className="text-sm text-cyan-300">{item.href}</div>
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((_, filterIndex) => filterIndex !== index))}
                className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={draft.label}
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
            placeholder="Label"
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
          />
          <input
            value={draft.href}
            onChange={(event) => setDraft((current) => ({ ...current, href: event.target.value }))}
            placeholder="/about or https://..."
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (!draft.label.trim()) return;
              setItems((current) => [...current, { label: draft.label.trim(), href: draft.href.trim() || "/", position: current.length }]);
              setDraft({ label: "", href: "" });
            }}
            className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
          >
            Add item
          </button>
          <button type="button" onClick={save} className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-200">
            Save navigation
          </button>
        </div>
        {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
      </div>
    </div>
  );
}

export function FooterEditor({ footer }: { footer: FooterRecord }) {
  const router = useRouter();
  const [form, setForm] = useState(footer);
  const [message, setMessage] = useState("");

  const updateLink = (index: number, field: "label" | "href", value: string) => {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: value } : link)),
    }));
  };

  const addLink = () => {
    setForm((current) => ({ ...current, links: [...current.links, { label: "New link", href: "/", position: current.links.length }] }));
  };

  const save = async () => {
    try {
      await requestJson("/api/footer", "PUT", form);
      setMessage("Footer saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Footer save failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            Title
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-slate-300">
            Description
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" rows={3} />
          </label>
          <label className="block text-sm text-slate-300">
            Copyright
            <input value={form.copyright ?? ""} onChange={(event) => setForm((current) => ({ ...current, copyright: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Footer links</h2>
          <button type="button" onClick={addLink} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">Add link</button>
        </div>
        <div className="space-y-3">
          {form.links.map((link, index) => (
            <div key={`${link.label}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={link.label}
                onChange={(event) => updateLink(index, "label", event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
              <input
                value={link.href}
                onChange={(event) => updateLink(index, "href", event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, links: current.links.filter((_, i) => i !== index) }))}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save footer</button>
        {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
      </div>
    </div>
  );
}

export function SeoEditor({ entries }: { entries: SeoEntry[] }) {
  const router = useRouter();
  const [list, setList] = useState(entries);
  const [message, setMessage] = useState("");

  const updateField = (index: number, field: keyof SeoEntry, value: string) => {
    setList((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [field]: value } : entry)));
  };

  const save = async () => {
    try {
      await requestJson("/api/seo", "PUT", { entries: list });
      setMessage("SEO settings saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SEO save failed.");
    }
  };

  return (
    <div className="space-y-6">
      {list.map((entry, index) => (
        <div key={entry.slug} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-lg font-bold text-white">/{entry.slug}</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm text-slate-300">
              Title
              <input value={entry.title ?? ""} onChange={(event) => updateField(index, "title", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              Description
              <textarea value={entry.description ?? ""} onChange={(event) => updateField(index, "description", event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              Keywords
              <input value={entry.keywords ?? ""} onChange={(event) => updateField(index, "keywords", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
            </label>
            <label className="block text-sm text-slate-300">
              Canonical
              <input value={entry.canonical ?? ""} onChange={(event) => updateField(index, "canonical", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
            </label>
          </div>
        </div>
      ))}
      <button type="button" onClick={save} className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save SEO</button>
      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function MediaEditor({ media }: { media: MediaRecord[] }) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [draft, setDraft] = useState({ title: "", url: "", mimeType: "image/png", altText: "" });
  const [message, setMessage] = useState("");

  const save = async () => {
    try {
      const body = {
        title: draft.title,
        url: draft.url,
        mimeType: draft.mimeType,
        altText: draft.altText,
        caption: draft.altText,
        size: 0,
      };

      const response = await requestJson<{ success: true; media: MediaRecord }>("/api/media", "POST", body);
      setItems((current) => [...current, response.media]);
      setDraft({ title: "", url: "", mimeType: "image/png", altText: "" });
      setMessage("Media saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Media save failed.");
    }
  };

  const remove = async (item: MediaRecord) => {
    if (!confirmDeleteAction(`media "${item.title}"`)) {
      return;
    }

    try {
      await requestJson("/api/media", "DELETE", { id: item.id });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(`Removed ${item.title}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Add media</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          <input value={draft.url} onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))} placeholder="https://... or /image.png" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          <input value={draft.altText} onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))} placeholder="Alt text" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white md:col-span-2" />
          <select value={draft.mimeType} onChange={(event) => setDraft((current) => ({ ...current, mimeType: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white md:col-span-2">
            <option value="image/png">image/png</option>
            <option value="image/jpeg">image/jpeg</option>
            <option value="image/webp">image/webp</option>
            <option value="image/svg+xml">image/svg+xml</option>
          </select>
        </div>
        <button type="button" onClick={save} className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save media</button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Media library</h2>
        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-8 text-center">
            <div className="text-lg font-semibold text-white">No media uploaded yet</div>
            <p className="mt-2 text-sm text-slate-400">Add your first asset above to start building the gallery.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                {item.url ? (
                  <Image src={item.url} alt={item.altText ?? item.title} width={1200} height={700} className="h-28 w-full rounded-xl object-cover" />
                ) : null}
                <div className="mt-3 font-semibold text-white">{item.title}</div>
                <div className="text-xs text-slate-400">{item.mimeType}</div>
                <div className="mt-2 text-sm text-cyan-300">{item.size ? `${item.size} bytes` : "No size recorded"}</div>
                <button type="button" onClick={() => remove(item)} className="mt-3 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {message ? <div className="text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function SettingsEditor({ settings }: { settings: Array<{ id: string; key: string; slug: string; value: string; status: string }> }) {
  const router = useRouter();

  const [formState, setFormState] = useState(() =>
    settings.map((entry) => ({
      id: entry.id,
      key: entry.key,
      label: entry.key,
      type: entry.value === "true" || entry.value === "false" ? "checkbox" : "text",
      value: entry.value,
    })),
  );
  const [message, setMessage] = useState("");

  const save = async () => {
    try {
      const payload = formState.map((field) => ({
        id: field.id,
        key: field.key,
        slug: field.key,
        value: field.value,
        status: "PUBLISHED",
      }));

      await requestJson("/api/cms/settings", "PUT", { settings: payload });
      setMessage("Settings saved successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Settings save failed.");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {formState.map((field) => (
          <label key={field.key} className="block text-sm text-slate-300 md:col-span-1">
            <span className="mb-1 block font-medium text-white">{field.label}</span>
            {field.type === "checkbox" ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
                <input
                  type="checkbox"
                  checked={field.value === "true"}
                  onChange={(event) =>
                    setFormState((current) =>
                      current.map((item) => (item.key === field.key ? { ...item, value: String(event.target.checked) } : item)),
                    )
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-cyan-400"
                />
                <span>{field.value === "true" ? "Enabled" : "Disabled"}</span>
              </div>
            ) : (
              <input
                type="text"
                value={field.value}
                onChange={(event) =>
                  setFormState((current) =>
                    current.map((item) => (item.key === field.key ? { ...item, value: event.target.value } : item)),
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"
              />
            )}
          </label>
        ))}
      </div>

      <button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save settings</button>
      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function LeadsEditor({ leads }: { leads: Array<{ id: string; name: string; email: string; company: string; message: string; source: string; status: string }> }) {
  const router = useRouter();
  const [items, setItems] = useState(leads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  const filtered = items.filter((lead) => {
    const matchesSearch = [lead.name, lead.email, lead.company, lead.message].some((field) => field.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (leadId: string, status: string) => {
    try {
      await requestJson("/api/cms/leads", "PUT", { id: leadId, status });
      setItems((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
      setMessage("Lead status updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead update failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="grid gap-3 md:grid-cols-[1.5fr_0.6fr]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-8 text-center">
            <div className="text-lg font-semibold text-white">No leads match the current filters</div>
            <p className="mt-2 text-sm text-slate-400">New submissions will appear here as soon as prospects start engaging with the site.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-white">{lead.name}</div>
                    <div className="text-sm text-slate-300">{lead.email}</div>
                    <div className="text-sm text-cyan-300">{lead.company}</div>
                  </div>
                  <div className="w-full md:max-w-[200px]">
                    <select value={lead.status} onChange={(event) => updateStatus(lead.id, event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                      <option value="SCHEDULED">Scheduled</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-300">Source: {lead.source}</div>
                <div className="mt-2 text-sm text-slate-300">{lead.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message ? <div className="text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}

export function FormsEditor({ forms }: { forms: Array<{ id: string; name: string; slug: string; status: string; fields: unknown[] }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(forms);

  const createBlankDraft = () => ({
    id: "",
    name: "",
    slug: "",
    status: "PUBLISHED",
    fields: [{ label: "Full name", type: "text", placeholder: "Full name", required: true }],
  });

  const [draft, setDraft] = useState(createBlankDraft());
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("view") !== "create") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setDraft(createBlankDraft());
      router.replace("/studio/forms");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [router, searchParams]);

  const updateField = (index: number, key: string, value: string | boolean) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) => {
        if (fieldIndex !== index) {
          return field;
        }

        return { ...field, [key]: value };
      }),
    }));
  };

  const addField = () => {
    setDraft((current) => ({
      ...current,
      fields: [...current.fields, { label: "New field", type: "text", placeholder: "Enter value", required: false }],
    }));
  };

  const removeField = (index: number) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }));
  };

  const selectForm = (form: { id: string; name: string; slug: string; status: string; fields: unknown[] }) => {
    setDraft({
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      fields: Array.isArray(form.fields)
        ? form.fields.map((field) => ({
            label: typeof field === "object" && field !== null && "label" in field ? String((field as { label?: unknown }).label ?? "Field") : "Field",
            type: typeof field === "object" && field !== null && "type" in field ? String((field as { type?: unknown }).type ?? "text") : "text",
            placeholder: typeof field === "object" && field !== null && "placeholder" in field ? String((field as { placeholder?: unknown }).placeholder ?? "") : "",
            required: typeof field === "object" && field !== null && "required" in field ? Boolean((field as { required?: unknown }).required) : false,
          }))
        : [{ label: "Full name", type: "text", placeholder: "Full name", required: true }],
    });
  };

  const startNewForm = () => {
    setDraft(createBlankDraft());
    router.push("/studio/forms?view=create");
  };

  const save = async () => {
    try {
      const payload = {
        id: draft.id || undefined,
        name: draft.name,
        slug: draft.slug,
        status: draft.status,
        fields: draft.fields.map((field) => ({
          label: String(field.label ?? "Field"),
          type: String(field.type ?? "text"),
          placeholder: String(field.placeholder ?? ""),
          required: Boolean(field.required),
        })),
      };

      const method = draft.id ? "PUT" : "POST";
      const response = await requestJson<{ success: true; form: { id: string; name: string; slug: string; status: string; fields: unknown[] } }>("/api/cms/forms", method, payload);

      setItems((current) => {
        if (draft.id) {
          return current.map((item) => (item.id === draft.id ? { ...item, ...payload, id: response.form.id } : item));
        }
        return [{ id: response.form.id, name: response.form.name, slug: response.form.slug, status: response.form.status, fields: response.form.fields ?? [] }, ...current];
      });

      setDraft(createBlankDraft());
      setMessage("Form saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Form save failed.");
    }
  };

  const remove = async (formId: string) => {
    const target = items.find((item) => item.id === formId);
    if (!target) return;

    if (!confirmDeleteAction(`form "${target.name}"`)) {
      return;
    }

    try {
      await requestJson("/api/cms/forms", "DELETE", { id: formId });
      setItems((current) => current.filter((item) => item.id !== formId));
      setMessage("Form deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Forms</h2>
          <button type="button" onClick={startNewForm} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">New form</button>
        </div>
        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-8 text-center">
            <div className="text-lg font-semibold text-white">No forms created yet</div>
            <p className="mt-2 text-sm text-slate-400">Create a form on the right to capture leads, appointments, or customer inquiries.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((form) => (
              <div key={form.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div>
                  <div className="font-semibold text-white">{form.name}</div>
                  <div className="text-sm text-cyan-300">/{form.slug}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => selectForm(form)} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">Edit</button>
                  <button type="button" onClick={() => remove(form.id)} className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">{draft.id ? "Edit form" : "Create form"}</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-slate-300">
            Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-slate-300">
            Slug
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-slate-300">
            Status
            <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Fields</span>
              <button type="button" onClick={addField} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">Add field</button>
            </div>

            {draft.fields.map((field, index) => (
              <div key={`${field.label}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Field {index + 1}</span>
                  <button type="button" onClick={() => removeField(index)} className="text-xs text-red-300">Remove</button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs text-slate-300">
                    Label
                    <input value={String(field.label ?? "")} onChange={(event) => updateField(index, "label", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white" />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-xs text-slate-300">
                      Type
                      <select value={String(field.type ?? "text")} onChange={(event) => updateField(index, "type", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </label>

                    <label className="block text-xs text-slate-300">
                      Placeholder
                      <input value={String(field.placeholder ?? "")} onChange={(event) => updateField(index, "placeholder", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white" />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input checked={Boolean(field.required)} onChange={(event) => updateField(index, "required", event.target.checked)} type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500" />
                    Required field
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={save} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Save form</button>
        </div>
      </div>

      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </div>
  );
}
