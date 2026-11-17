"use client";

import Link from "next/link";
import { ArrowRight, FileText, Globe, ImageIcon, MessageSquareText, Newspaper, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

const statsConfig = [
  { key: "pages", label: "Pages", icon: FileText, accent: "from-cyan-400/20 to-cyan-500/5" },
  { key: "blog", label: "Blog", icon: Newspaper, accent: "from-violet-400/20 to-violet-500/5" },
  { key: "faqs", label: "FAQs", icon: MessageSquareText, accent: "from-emerald-400/20 to-emerald-500/5" },
  { key: "services", label: "Services", icon: Globe, accent: "from-amber-400/20 to-amber-500/5" },
  { key: "media", label: "Media", icon: ImageIcon, accent: "from-pink-400/20 to-pink-500/5" },
  { key: "leads", label: "Leads", icon: Users, accent: "from-rose-400/20 to-rose-500/5" },
] as const;

const menu = [
  { href: "/cms/pages", label: "Pages" },
  { href: "/cms/blog", label: "Blog" },
  { href: "/cms/faqs", label: "FAQs" },
  { href: "/cms/services", label: "Services" },
  { href: "/cms/media", label: "Media" },
  { href: "/cms/leads", label: "Leads" },
];

function getCount(response: Record<string, unknown>, key: string) {
  const value = response[key];
  if (Array.isArray(value)) return value.length;
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const items = record.items;
    const pages = record.pages;
    const media = record.media;
    const leads = record.leads;

    if (Array.isArray(items)) return items.length;
    if (Array.isArray(pages)) return pages.length;
    if (Array.isArray(media)) return media.length;
    if (Array.isArray(leads)) return leads.length;
  }
  return 0;
}

export default function CmsOverviewPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const endpoints = [
          ["pages", "/api/cms/pages"],
          ["blog", "/api/cms/blog"],
          ["faqs", "/api/cms/faqs"],
          ["services", "/api/cms/services"],
          ["media", "/api/media"],
          ["leads", "/api/cms/leads"],
        ] as const;

        const values = await Promise.all(
          endpoints.map(async ([key, url]) => {
            const response = await fetch(url);
            const payload = (await response.json()) as Record<string, unknown>;
            return [key, getCount(payload, key === "pages" ? "pages" : key === "media" ? "media" : "items")] as const;
          }),
        );

        setCounts(Object.fromEntries(values));
      } catch {
        setCounts({ pages: 0, blog: 0, faqs: 0, services: 0, media: 0, leads: 0 });
      } finally {
        setLoading(false);
      }
    }

    void fetchCounts();
  }, []);

  return (
    <CmsShell title="Dashboard" description="Operational content overview and admin shortcuts.">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsConfig.map(({ key, label, icon: Icon, accent }) => (
            <div key={key} className={`rounded-[26px] border border-slate-800 bg-gradient-to-br ${accent} p-[1px]`}>
              <div className="h-full rounded-[25px] bg-[#0d151d]/95 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 text-cyan-300">
                    <Icon size={18} />
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">Live</span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-3xl font-semibold text-white">{loading ? "—" : counts[key] ?? 0}</div>
                    <div className="mt-1 text-sm text-slate-400">{label}</div>
                  </div>
                  <div className="text-xs text-cyan-300">+12% this month</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Quick actions</h2>
                <p className="mt-1 text-sm text-slate-400">Common public content tasks</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {menu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-cyan-500/30 hover:bg-slate-900/80"
                >
                  <div>
                    <div className="text-base font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-400">Manage {item.label.toLowerCase()} content</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-500 transition group-hover:text-cyan-300" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-[#0b1218]/85 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Workspace health</h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-emerald-300">Optimal</span>
            </div>

            <div className="space-y-4">
              {[
                { label: "Publishing pipeline", value: "94%", tone: "bg-emerald-400" },
                { label: "Content freshness", value: "87%", tone: "bg-cyan-400" },
                { label: "Media library", value: "72%", tone: "bg-violet-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-medium text-white">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className={`h-2 rounded-full ${item.tone}`} style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </CmsShell>
  );
}
