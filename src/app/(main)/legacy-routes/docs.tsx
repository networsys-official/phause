"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Menu,
  Search,
  X,
} from "lucide-react";

/* ══════════════════ CONTENT MODEL ══════════════════ */

type Block =
  | { type: "h2"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "note"; text: string }
  | { type: "deepdive"; title: string; body: string };

type Doc = {
  slug: string;
  title: string;
  intro: string;
  blocks: Block[];
};

/* Use `backticks` inside any text to render inline code. */
const DOCS: Doc[] = [
  {
    slug: "first-campaign-checklist",
    title: "Your first Phause campaign: a practical checklist",
    intro:
      "Set up an authorised campaign, prepare employees, create a template and review the results.",
    blocks: [
      { type: "h2", id: "before-you-begin", text: "Before you begin" },
      {
        type: "list",
        items: [
          "Confirm approval and scope.",
          "Verify organisation setup and authorisation.",
          "Add employee records.",
          "Review eligibility.",
          "Configure and test email delivery.",
        ],
      },
      { type: "h2", id: "create-the-template", text: "Create the template" },
      {
        type: "list",
        items: [
          "Open Templates.",
          "Select or create a phishing email template.",
          "Add subject and message content.",
          "Choose lure type, category and difficulty.",
          "Preview and save.",
        ],
      },
      { type: "h2", id: "configure-the-campaign", text: "Configure the campaign" },
      {
        type: "list",
        items: [
          "Choose the saved template.",
          "Enter a campaign name.",
          "Select the target audience.",
          "Configure delivery timing.",
          "Review and dispatch or schedule.",
        ],
      },
    ],
  },
];

/* ══════════════════ SIDEBAR STRUCTURE ══════════════════ */

type NavItem =
  | { kind: "page"; slug: string }
  | { kind: "group"; id: string; title: string; slugs: string[] };

type NavSection = { label: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    label: "Get started",
    items: [{ kind: "page", slug: "first-campaign-checklist" }],
  },
];

const DOC_MAP = Object.fromEntries(DOCS.map((d) => [d.slug, d])) as Record<
  string,
  Doc
>;

/* Reading order, used for the Previous / Next links */
const ORDER: string[] = NAV.flatMap((s) =>
  s.items.flatMap((i) => (i.kind === "page" ? [i.slug] : i.slugs))
);

function findLocation(slug: string) {
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.kind === "page" && item.slug === slug)
        return { section: section.label, group: null as string | null, groupId: null as string | null };
      if (item.kind === "group" && item.slugs.includes(slug))
        return { section: section.label, group: item.title, groupId: item.id };
    }
  }
  return { section: "Get started", group: null, groupId: null };
}

/* ══════════════════ SMALL HELPERS ══════════════════ */

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-phause-cyan"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-xs text-slate-500">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-phause-cyan"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function DeepDive({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-10 rounded-2xl border border-phause-cyan/20 bg-phause-cyan/[0.05] p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-phause-cyan">
        <BookOpen className="h-4 w-4" />
        Deep dive
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-5 py-2 text-sm font-bold text-phause-dark"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
        {open ? "Hide Details" : "Show Details"}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pt-5 leading-relaxed text-slate-300">
              <Inline text={body} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          id={block.id}
          className="mb-4 mt-14 scroll-mt-44 text-2xl font-extrabold text-white sm:text-3xl"
        >
          {block.text}
        </h2>
      );
    case "p":
      return (
        <p className="my-4 leading-8 text-slate-300">
          <Inline text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className="my-4 space-y-2 pl-1">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-300">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-phause-cyan" />
              <span className="leading-8">
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "code":
      return <CodeBlock lang={block.lang} code={block.code} />;
    case "note":
      return (
        <div className="my-6 flex gap-3 rounded-xl border border-phause-cyan/20 bg-phause-cyan/[0.06] p-5">
          <Info className="mt-1 h-5 w-5 shrink-0 text-phause-cyan" />
          <p className="leading-7 text-slate-300">
            <Inline text={block.text} />
          </p>
        </div>
      );
    case "deepdive":
      return <DeepDive title={block.title} body={block.body} />;
  }
}

/* ══════════════════ SIDEBAR ══════════════════ */

function Sidebar({
  active,
  openGroups,
  toggleGroup,
  onSelect,
}: {
  active: string;
  openGroups: Set<string>;
  toggleGroup: (id: string) => void;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav aria-label="Documentation" className="space-y-8 pb-10">
      {NAV.map((section) => (
        <div key={section.label}>
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => {
              if (item.kind === "page") {
                const isActive = active === item.slug;
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.slug)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-bold transition-colors ${
                        isActive
                          ? "bg-phause-cyan/10 text-phause-cyan"
                          : "text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      {DOC_MAP[item.slug].title}
                    </button>
                  </li>
                );
              }

              const isOpen = openGroups.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleGroup(item.id)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-bold text-slate-200 transition-colors hover:bg-white/[0.04]"
                  >
                    {item.title}
                    <ChevronRight
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-phause-cyan" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        {item.slugs.map((slug) => {
                          const isActive = active === slug;
                          return (
                            <li key={slug}>
                              <button
                                type="button"
                                onClick={() => onSelect(slug)}
                                aria-current={isActive ? "page" : undefined}
                                className={`mt-1 w-full rounded-xl py-2.5 pl-6 pr-3 text-left text-sm transition-colors ${
                                  isActive
                                    ? "bg-phause-cyan/10 font-medium text-phause-cyan"
                                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                }`}
                              >
                                {DOC_MAP[slug].title}
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ══════════════════ SEARCH DIALOG ══════════════════ */

function SearchDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCS;
    return DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) || d.intro.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-phause-cyan/20 bg-slate-950"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the docs"
                className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="text-slate-500 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500">
                  No pages match “{query}”. Try a different word.
                </li>
              )}
              {results.map((d) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(d.slug);
                      onClose();
                    }}
                    className="w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <p className="font-semibold text-slate-200">{d.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                      {d.intro}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════ PAGE ══════════════════ */

export default function DocsPage() {
  const [cmsDocs, setCmsDocs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch("/api/cms/pages?slug=docs")
      .then((response) => response.json())
      .then((payload) => {
        const block = Array.isArray(payload.page?.blocks)
          ? payload.page.blocks.find((entry: Record<string, unknown>) => entry?.type === "CUSTOM_SECTION")
          : null;
        const items = Array.isArray(block?.props?.items) ? block.props.items : [];
        setCmsDocs(items as Array<Record<string, unknown>>);
        setDocsClosingNote(typeof block?.props?.closingNote === "string" ? block.props.closingNote : "");
      })
      .catch(() => setCmsDocs([]));
  }, []);

  const [active, setActive] = useState<string>(() => {
    if (typeof window === "undefined") return ORDER[0];
    const slug = window.location.hash.replace("#", "");
    return slug && DOC_MAP[slug] ? slug : ORDER[0];
  });
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(["installation"]);
    const slug = window.location.hash.replace("#", "");
    const group = slug && DOC_MAP[slug] ? findLocation(slug).groupId : undefined;
    return group ? new Set([group, "installation"]) : new Set(["installation"]);
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageCopied, setPageCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [docsClosingNote, setDocsClosingNote] = useState("");

  const doc = DOC_MAP[active] ?? DOCS[0];
  const loc = findLocation(active);
  const index = ORDER.indexOf(active);
  const prev = index > 0 ? DOC_MAP[ORDER[index - 1]] : null;
  const next = index < ORDER.length - 1 ? DOC_MAP[ORDER[index + 1]] : null;
  const headings = doc.blocks.filter(
    (b): b is Extract<Block, { type: "h2" }> => b.type === "h2"
  );

  const select = useCallback((slug: string) => {
    setActive(slug);
    setMobileNav(false);
    const group = findLocation(slug).groupId;
    if (group) setOpenGroups((prev) => new Set(prev).add(group));
    window.history.replaceState(null, "", `#${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });

  /* Ctrl/Cmd + K opens search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileNav(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Highlight the current heading in "On this page" */
  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const updateActiveHeading = (id: string) => {
      setActiveHeading((current) => (current === id ? current : id));
    };

    updateActiveHeading(els[0].id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) updateActiveHeading(e.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const copyPage = async () => {
    const text = [
      doc.title,
      doc.intro,
      ...doc.blocks.map((b) => {
        switch (b.type) {
          case "h2":
            return `\n## ${b.text}`;
          case "p":
          case "note":
            return b.text;
          case "list":
            return b.items.map((i) => `- ${i}`).join("\n");
          case "code":
            return "```" + b.lang + "\n" + b.code + "\n```";
          case "deepdive":
            return `${b.title}\n${b.body}`;
        }
      }),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setPageCopied(true);
      setTimeout(() => setPageCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="relative pt-20">
      {cmsDocs.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">CMS docs</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {cmsDocs.map((docItem, index) => {
                const articles = Array.isArray(docItem.articles) ? docItem.articles as Array<Record<string, unknown>> : [];
                return (
                  <div key={`${docItem.category ?? docItem.title ?? index}`} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="font-semibold text-white">{String(docItem.category ?? docItem.title ?? "Documentation")}</div>
                    {articles.length ? <ul className="mt-3 space-y-1">{articles.map((article, articleIndex) => <li key={String(article.slug ?? articleIndex)} className="text-sm text-slate-300"><span>{String(article.title ?? "Article")}</span>{article.status === "DRAFT" ? <span className="ml-2 text-xs text-slate-500">Draft</span> : null}</li>)}</ul> : <div className="mt-2 text-sm text-slate-300">{String(docItem.description ?? docItem.intro ?? docItem.title ?? "")}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Docs top bar (sticky, sits under the site navbar) ─── */}
      <div className="sticky top-20 z-30 border-y border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.06] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="hidden rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-3 py-1 text-sm font-semibold text-phause-cyan sm:inline">
            v2.4
          </span>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 flex-1 items-center gap-3 rounded-full bg-white/[0.05] px-4 text-left text-slate-500 transition-colors hover:bg-white/[0.08]"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search</span>
            <span className="hidden gap-1 sm:flex">
              <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-xs">
                Ctrl
              </kbd>
              <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-xs">
                K
              </kbd>
            </span>
          </button>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <span className="rounded-full bg-phause-cyan/10 px-4 py-2 text-phause-cyan">
              Learn
            </span>
            <Link
              href="/blog"
              className="rounded-full px-4 py-2 text-slate-300 transition-colors hover:text-phause-cyan"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="rounded-full px-4 py-2 text-slate-300 transition-colors hover:text-phause-cyan"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="rounded-full px-4 py-2 text-slate-300 transition-colors hover:text-phause-cyan"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>

      {/* ─── Three-column layout ─── */}
      <div className="mx-auto flex max-w-[90rem] gap-10 px-4 sm:px-6">
        {/* Left sidebar (desktop) */}
        <aside className="sticky top-[8.5rem] hidden h-[calc(100vh-8.5rem)] w-72 shrink-0 overflow-y-auto pr-2 pt-8 lg:block">
          <Sidebar
            active={active}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            onSelect={select}
          />
        </aside>

        {/* Main article */}
        <main className="min-w-0 flex-1 py-10 lg:py-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-3xl"
            >
              <div className="flex items-start justify-between gap-4">
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-phause-cyan"
                >
                  <span>{loc.section}</span>
                  {loc.group && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span>{loc.group}</span>
                    </>
                  )}
                  <ChevronRight className="h-4 w-4" />
                </nav>

                <button
                  type="button"
                  onClick={copyPage}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-phause-cyan/40 hover:text-phause-cyan"
                >
                  {pageCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {pageCopied ? "Copied" : "Copy page"}
                </button>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-5xl">
                {doc.title}
              </h1>
              <p className="mt-6 text-xl leading-9 text-slate-300">
                {doc.intro}
              </p>

              {doc.blocks.map((block, i) => (
                <RenderBlock key={i} block={block} />
              ))}

              {/* Previous / Next */}
              <div className="mt-16 grid gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-2">
                {prev ? (
                  <button
                    type="button"
                    onClick={() => select(prev.slug)}
                    className="group glass rounded-2xl p-5 text-left transition-colors hover:border-phause-cyan/40"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-500">
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      Previous
                    </span>
                    <span className="mt-1 block font-bold text-slate-200">
                      {prev.title}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {next && (
                  <button
                    type="button"
                    onClick={() => select(next.slug)}
                    className="group glass rounded-2xl p-5 text-right transition-colors hover:border-phause-cyan/40 sm:col-start-2"
                  >
                    <span className="flex items-center justify-end gap-2 text-sm text-slate-500">
                      Next
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="mt-1 block font-bold text-slate-200">
                      {next.title}
                    </span>
                  </button>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </main>

        {/* Right: on this page */}
        <aside className="sticky top-[8.5rem] hidden h-fit w-56 shrink-0 pt-12 xl:block">
          {headings.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                On this page
              </p>
              <ul className="space-y-1 border-l border-white/[0.08]">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(h.id)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                        activeHeading === h.id
                          ? "border-phause-cyan text-phause-cyan"
                          : "border-transparent text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {/* ─── Mobile drawer ─── */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              className="fixed inset-0 z-[90] bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-[95] w-80 max-w-[85vw] overflow-y-auto bg-slate-950 p-4 lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold text-white">Documentation</span>
                <button
                  type="button"
                  onClick={() => setMobileNav(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                active={active}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
                onSelect={select}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchDialog
        key={searchOpen ? "docs-search-open" : "docs-search-closed"}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={select}
      />

      {docsClosingNote ? <p className="mx-auto max-w-6xl px-6 pb-10 text-center text-sm text-slate-500">{docsClosingNote}</p> : null}
    </section>
  );
}
