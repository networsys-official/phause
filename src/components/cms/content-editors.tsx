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
  const initialSectionsRef = useRef(blocks.map((block) => normalizeBlockRecord(block)));
  const [sections, setSections] = useState(() => blocks.map((block) => normalizeBlockRecord(block)));
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "info" | "warning" | "error"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pageVersion, setPageVersion] = useState(page.version ?? 1);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [conflictReloadAvailable, setConflictReloadAvailable] = useState(false);
  const [draft, setDraft] = useState<PageMenuDraft>({
    showInHeader: page.showInHeader ?? false,
    headerLabel: page.headerLabel ?? page.title,
    headerPosition: page.headerPosition ?? 0,
    showInFooter: page.showInFooter ?? false,
    footerGroup: page.footerGroup === "QUICK_LINKS" || page.footerGroup === "SERVICES" || page.footerGroup === "LEGAL" ? page.footerGroup : "QUICK_LINKS",
    footerLabel: page.footerLabel ?? page.title,
    footerPosition: page.footerPosition ?? 0,
  });

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

      const saved = await requestJson<CmsSaveResponse>("/api/cms/pages", "PUT", payload);
      if (!saved.success || !saved.page) throw new Error("The server did not return the saved page.");
      if (typeof saved.page.version === "number") setPageVersion(saved.page.version);
      window.localStorage.setItem("phause:cms-page-updated", String(Date.now()));
      setSaveState("success");
      setHasUnsavedChanges(false);
      setSections(saved.page.blocks.map((block) => normalizeBlockRecord(block)));
      initialSectionsRef.current = saved.page.blocks.map((block) => normalizeBlockRecord(block));
      setMessage("✅ Changes saved successfully.");
      setToast({ type: "success", message: "✅ Home page updated successfully" });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Page save failed.";
      setSaveState("error");
      setToast({ type: "error", message });
      setMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const leaveWithoutSaving = () => {
    setHasUnsavedChanges(false);
    setShowLeaveDialog(false);
    router.refresh();
  };

  const safeButtonClasses = "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50";

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

      {conflictReloadAvailable ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <span>Someone else changed this page. Your unsaved text is still here.</span>
          <button type="button" onClick={() => { if (window.confirm("Reload latest page? Unsaved text in this editor will be replaced.")) router.refresh(); }} className="rounded-lg border border-amber-300/40 px-3 py-1.5 font-semibold text-amber-100">Reload latest</button>
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
              <input required value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
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
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
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

      <PageMenuFields
        page={page}
        draft={draft}
        setDraft={setDraft}
        markChanged={() => setHasUnsavedChanges(true)}
      />

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
              <input required value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
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
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
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

      <PageMenuFields
        page={page}
        draft={draft}
        setDraft={setDraft}
        markChanged={() => setHasUnsavedChanges(true)}
      />

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
              <input required value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
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
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
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

      <PageMenuFields
        page={page}
        draft={draft}
        setDraft={setDraft}
        markChanged={() => setHasUnsavedChanges(true)}
      />

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
              <input required value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
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
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
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

      <PageMenuFields
        page={page}
        draft={draft}
        setDraft={setDraft}
        markChanged={() => setHasUnsavedChanges(true)}
      />

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
              <input required value={String(section.props.title ?? "")} onChange={(event) => updateSection(section.id, "title", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Title for section ${index + 1}`} />
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
              <input value={String(section.props.buttonLink ?? "")} onChange={(event) => updateSection(section.id, "buttonLink", event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" aria-label={`Button text for section ${index + 1}`} />
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
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Navigation</h2><div className="mt-4 space-y-3">{items.map((item, index) => <div key={item.id ?? `${item.href}-${index}`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 md:grid-cols-[1fr_1fr_100px]"><input value={item.label} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation label" /><input value={item.href} readOnly={Boolean(item.pageId)} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, href: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation URL" /><input type="number" value={item.position} onChange={(event) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, position: Number(event.target.value) } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Navigation order" /></div>)}</div><button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Save navigation</button>{message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}</div>;
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
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Footer</h2><div className="mt-4 grid gap-3"><input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer title" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer description" /><input value={copyright} onChange={(event) => setCopyright(event.target.value)} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white" aria-label="Footer copyright" /><div className="space-y-3">{links.map((link, index) => <div key={link.id ?? `${link.href}-${index}`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-3 md:grid-cols-[1fr_1fr_100px]"><input value={link.label} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer label" /><input value={link.href} readOnly={Boolean(link.pageId)} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, href: event.target.value } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer URL" /><input type="number" value={link.position} onChange={(event) => setLinks((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, position: Number(event.target.value) } : entry))} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white" aria-label="Footer order" /></div>)}</div></div><button type="button" onClick={save} className="mt-5 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">Save footer</button>{message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}</div>;
}

export function PagesEditor({ pages }: { pages: PageRecord[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ id: "", title: "", slug: "", status: "DRAFT" as "DRAFT" | "PUBLISHED", showInHeader: false, headerLabel: "", headerPosition: 0, showInFooter: false, footerGroup: "QUICK_LINKS", footerLabel: "", footerPosition: 0 });
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onDelete = async (page: PageRecord) => {
    if (["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"].includes(page.slug)) {
      setToast({ type: "error", message: "System pages cannot be deleted." });
      return;
    }
    if (!confirmDeleteAction(`page "${page.title}"`)) return;
    try {
      await requestJson("/api/cms/pages", "DELETE", { slug: page.slug });
      setMessage(`Deleted page ${page.title}.`);
      router.refresh();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Delete failed." });
    }
  };

  const isEditing = Boolean(draft.id);
  const systemSlug = isEditing && ["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"].includes(draft.slug);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const method = isEditing ? "PUT" : "POST";
      const payload: Record<string, unknown> = {
        id: draft.id || undefined,
        title: draft.title,
        status: draft.status,
        showInHeader: draft.showInHeader,
        headerLabel: draft.headerLabel || draft.title,
        headerPosition: draft.headerPosition,
        showInFooter: draft.showInFooter,
        footerGroup: draft.footerGroup,
        footerLabel: draft.footerLabel || draft.title,
        footerPosition: draft.footerPosition,
        blocks: [],
        seo: { title: draft.title, description: "Edited via CMS" },
      };
      if (!isEditing || !systemSlug) payload.slug = normalizeSlug(draft.slug || draft.title);
      await requestJson("/api/cms/pages", method, payload);
      setHasUnsavedChanges(false);
      setToast({ type: "success", message: "Page saved successfully." });
      setMessage("Page saved successfully.");
      router.refresh();
    } catch (error) {
      const serverMessage = error instanceof Error ? error.message : "Page save failed.";
      setToast({ type: "error", message: serverMessage });
      setMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
    {hasUnsavedChanges ? <div className="xl:col-span-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">You have unsaved page changes.</div> : null}
    {toast ? <div className={`xl:col-span-2 rounded-xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100"}`} role="status">{toast.message}</div> : null}
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">Page list</h2>
      <div className="mt-4 space-y-3">{pages.map((page) => <div key={page.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><div><div className="font-semibold text-white">{page.title}</div><div className="text-sm text-cyan-300">/{page.slug}</div></div><div className="flex gap-2"><button type="button" onClick={() => router.push(`/cms/pages/${page.slug}`)} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-200">Edit</button><button type="button" disabled={["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"].includes(page.slug)} onClick={() => onDelete(page)} className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 disabled:cursor-not-allowed disabled:opacity-40">Delete</button></div></div>)}</div>
    </div>
    <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-xl font-bold text-white">{isEditing ? "Edit page" : "Add page"}</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm text-slate-300">Title<input required value={draft.title} onChange={(event) => { setDraft((current) => ({ ...current, title: event.target.value })); setHasUnsavedChanges(true); }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="block text-sm text-slate-300">Slug<input required readOnly={systemSlug} value={draft.slug} onChange={(event) => { setDraft((current) => ({ ...current, slug: event.target.value })); setHasUnsavedChanges(true); }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white read-only:cursor-not-allowed read-only:opacity-70" /><span className="mt-1 block text-xs text-cyan-200">{systemSlug ? "This page address is fixed" : "Use a unique URL slug"}</span></label>
        <label className="block text-sm text-slate-300">Status<select value={draft.status} onChange={(event) => { setDraft((current) => ({ ...current, status: event.target.value as "DRAFT" | "PUBLISHED" })); setHasUnsavedChanges(true); }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
      </div>
      <button type="submit" disabled={isLoading || !draft.title || (!systemSlug && !draft.slug)} className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Saving..." : isEditing ? "Save page" : "Create page"}</button>
      {message ? <div className="mt-3 text-sm text-cyan-200">{message}</div> : null}
    </form>
  </div>;
}

export function SeoEditor({ entries }: { entries: SeoEntry[] }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">SEO</h2><div className="mt-4 space-y-2">{entries.map((entry) => <div key={entry.slug} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><div className="font-semibold text-white">/{entry.slug}</div><div className="text-sm text-slate-300">{entry.title ?? "—"}</div></div>)}</div></div>;
}

export function MediaEditor({ media }: { media: MediaRecord[] }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Media</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950 p-3"><div className="font-semibold text-white">{item.title}</div><div className="mt-1 truncate text-xs text-cyan-300">{item.url}</div></div>)}</div></div>;
}

export function SettingsEditor({ settings }: { settings: Array<{ id: string; key: string; slug: string; value: string; status: string }> }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Settings</h2><div className="mt-4 space-y-2">{settings.map((setting) => <div key={setting.id} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 md:grid-cols-[1fr_2fr_auto]"><div className="font-semibold text-white">{setting.key}</div><div className="text-sm text-slate-300">{setting.value}</div><div className="text-xs text-slate-400">{setting.status}</div></div>)}</div></div>;
}

export function FormsEditor({ forms }: { forms: Array<{ id: string; name: string; slug: string; status: string; fields: unknown[] }> }) {
  return <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6"><h2 className="text-xl font-bold text-white">Forms</h2><div className="mt-4 space-y-2">{forms.map((form) => <div key={form.id} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><div className="font-semibold text-white">{form.name}</div><div className="text-xs text-slate-400">/{form.slug} · {form.status} · {form.fields.length} fields</div></div>)}</div></div>;
}