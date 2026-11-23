"use client";

import { useEffect, useMemo, useState } from "react";

import { PageMenuFields, type PageMenuDraft } from "@/components/cms/PageMenuFields";
import { cmsPageCreateUpdateSchema } from "@/features/cms/cms-page-contract";

export type PageFormValue = {
  id?: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  showInHeader: boolean;
  headerLabel: string;
  headerPosition: number;
  showInFooter: boolean;
  footerGroup: "QUICK_LINKS" | "SERVICES" | "LEGAL";
  footerLabel: string;
  footerPosition: number;
  starter: "BLANK" | "HERO_TEXT" | "HERO_TEXT_CTA";
  seoTitle: string;
  seoDescription: string;
};

const reservedSlugs = new Set(["api", "cms", "studio", "auth", "login", "registration", "_next", "admin", "home", "about", "services", "blog", "docs", "subscription", "contact", "faq", "privacy-policy", "terms-of-service", "how-it-works", "forgot-password", "reset-password", "403", "not-found"]);
const systemSlugs = new Set(["home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration"]);

function suggestedSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

export function PageForm({
  initial,
  existingSlugs = [],
  onSubmit,
}: {
  initial?: Partial<PageFormValue>;
  existingSlugs?: string[];
  onSubmit?: (value: PageFormValue, createAndEdit: boolean) => Promise<void>;
}) {
  const systemPage = Boolean(initial?.id && initial.slug && systemSlugs.has(initial.slug));
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [value, setValue] = useState<PageFormValue>(() => ({
    id: initial?.id,
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    status: initial?.status ?? "DRAFT",
    showInHeader: initial?.showInHeader ?? false,
    headerLabel: initial?.headerLabel ?? initial?.title ?? "",
    headerPosition: initial?.headerPosition ?? 0,
    showInFooter: initial?.showInFooter ?? false,
    footerGroup: initial?.footerGroup ?? "QUICK_LINKS",
    footerLabel: initial?.footerLabel ?? initial?.title ?? "",
    footerPosition: initial?.footerPosition ?? 0,
    starter: initial?.starter ?? "HERO_TEXT",
    seoTitle: initial?.seoTitle ?? initial?.title ?? "",
    seoDescription: initial?.seoDescription ?? "",
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const menuDraft: PageMenuDraft = {
    showInHeader: value.showInHeader,
    headerLabel: value.headerLabel,
    headerPosition: value.headerPosition,
    showInFooter: value.showInFooter,
    footerGroup: value.footerGroup,
    footerLabel: value.footerLabel,
    footerPosition: value.footerPosition,
  };

  const slugError = useMemo(() => {
    if (!value.slug) return "Address is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) return "Use lowercase letters, numbers, and hyphens only.";
    if (reservedSlugs.has(value.slug)) return `The address "${value.slug}" is reserved and cannot be used.`;
    if (!systemPage && existingSlugs.includes(value.slug) && existingSlugs.filter((slug) => slug === value.slug).length > 0 && value.slug !== initial?.slug) return `The address "${value.slug}" is already used.`;
    return "";
  }, [value.slug, existingSlugs, initial?.slug, systemPage]);

  const update = (patch: Partial<PageFormValue>) => {
    setValue((current) => {
      const next = { ...current, ...patch };
      if (patch.title !== undefined && !slugEdited && !systemPage) next.slug = suggestedSlug(patch.title);
      if (patch.title !== undefined) {
        if (!next.headerLabel || next.headerLabel === current.title) next.headerLabel = patch.title;
        if (!next.footerLabel || next.footerLabel === current.title) next.footerLabel = patch.title;
        if (!next.seoTitle || next.seoTitle === current.title) next.seoTitle = patch.title;
      }
      return next;
    });
    setHasChanges(true);
    setMessage("");
  };

  const submit = async (createAndEdit: boolean) => {
    setMessage("");
    setFieldErrors({});
    const parsed = cmsPageCreateUpdateSchema.safeParse({
      id: value.id,
      title: value.title,
      slug: value.slug,
      status: value.status,
      showInHeader: value.showInHeader,
      headerLabel: value.headerLabel,
      headerPosition: value.headerPosition,
      showInFooter: value.showInFooter,
      footerGroup: value.footerGroup,
      footerLabel: value.footerLabel,
      footerPosition: value.footerPosition,
      starter: value.starter,
      seo: { title: value.seoTitle, description: value.seoDescription },
      blocks: [],
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { if (issue.path[0]) errors[String(issue.path[0])] = issue.message; });
      setFieldErrors(errors);
      setMessage("Please correct the highlighted fields.");
      return;
    }
    if (slugError) {
      setFieldErrors({ slug: slugError });
      setMessage(slugError);
      return;
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(value, createAndEdit);
      } else {
        const method = value.id ? "PUT" : "POST";
        const response = await fetch("/api/cms/pages", {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(value.id
            ? {
                id: value.id,
                title: value.title,
                slug: value.slug,
                status: value.status,
                showInHeader: value.showInHeader,
                headerLabel: value.headerLabel || value.title,
                headerPosition: value.headerPosition,
                showInFooter: value.showInFooter,
                footerGroup: value.footerGroup,
                footerLabel: value.footerLabel || value.title,
                footerPosition: value.footerPosition,
                seo: { title: value.seoTitle || value.title, description: value.seoDescription || null },
              }
            : {
                title: value.title,
                slug: value.slug,
                status: value.status,
                showInHeader: value.showInHeader,
                headerLabel: value.headerLabel || value.title,
                headerPosition: value.headerPosition,
                showInFooter: value.showInFooter,
                footerGroup: value.footerGroup,
                footerLabel: value.footerLabel || value.title,
                footerPosition: value.footerPosition,
                starter: value.starter,
                seo: { title: value.seoTitle || value.title, description: value.seoDescription || null },
              }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Page could not be saved.");
      }
      setHasChanges(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Page could not be saved.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); void submit(false); }}>
      {hasChanges ? <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">You have unsaved page changes.</div> : null}
      {message ? <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{message}</div> : null}

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Basics</h2>
        <p className="mt-1 text-sm text-slate-400">Give this page a clear name and address.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-300">Title *<input required value={value.title} onChange={(event) => update({ title: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /><span className="mt-1 block text-xs text-slate-400">The title editors and visitors see.</span>{fieldErrors.title ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.title}</span> : null}</label>
          <label className="block text-sm text-slate-300">Address / slug *<input required readOnly={systemPage} value={value.slug} onChange={(event) => { setSlugEdited(true); update({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }); }} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white read-only:cursor-not-allowed read-only:opacity-70" /><span className={`mt-1 block text-xs ${slugError ? "text-rose-300" : "text-cyan-200"}`}>{systemPage ? "This system page address is fixed." : slugError || `Live address: /${value.slug}`}</span></label>
          <label className="block text-sm text-slate-300 md:col-span-2">Status<select value={value.status} onChange={(event) => update({ status: event.target.value as "DRAFT" | "PUBLISHED" })} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
        </div>
      </section>

      <PageMenuFields page={{ title: value.title, status: value.status }} draft={menuDraft} setDraft={(updater) => update(updater(menuDraft))} markChanged={() => setHasChanges(true)} />

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">Start content</h2>
        <p className="mt-1 text-sm text-slate-400">Choose the first layout for this page.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {([["BLANK", "Blank with title banner"], ["HERO_TEXT", "Hero + text"], ["HERO_TEXT_CTA", "Hero + text + call to action"]] as const).map(([id, label]) => (
            <label key={id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200"><input type="radio" checked={value.starter === id} onChange={() => update({ starter: id })} />{label}</label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold text-white">SEO (optional)</h2>
        <p className="mt-1 text-sm text-slate-400">Defaults come from the page title.</p>
        <div className="mt-4 grid gap-4">
          <label className="block text-sm text-slate-300">Page title in search results<input value={value.seoTitle} onChange={(event) => update({ seoTitle: event.target.value })} maxLength={60} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /><span className="mt-1 block text-xs text-slate-400">{value.seoTitle.length}/60 characters</span></label>
          <label className="block text-sm text-slate-300">Page description<textarea value={value.seoDescription} onChange={(event) => update({ seoDescription: event.target.value })} maxLength={160} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /><span className="mt-1 block text-xs text-slate-400">{value.seoDescription.length}/160 characters</span></label>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        {value.id ? <button type="submit" disabled={isLoading || Boolean(slugError)} className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Saving..." : "Save page"}</button> : <><button type="submit" disabled={isLoading || Boolean(slugError)} className="rounded-xl border border-cyan-400/40 px-5 py-3 font-semibold text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Creating..." : "Create page"}</button><button type="button" disabled={isLoading || Boolean(slugError)} onClick={() => void submit(true)} className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Creating..." : "Create and edit content"}</button></>}
      </div>
    </form>
  );
}
