"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Globe,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { buildSidebarStatusCounts, getSidebarStatusCount, getStudioActionLink, getStudioPageActions, STUDIO_NAV_ITEMS, validateStudioNavigation } from "@/lib/studio-navigation";

const iconMap: Record<string, typeof LayoutDashboard> = {
  "/studio": LayoutDashboard,
  "/studio/pages": FileText,
  "/studio/blog": Sparkles,
  "/studio/faqs": MessageSquareText,
  "/studio/services": FolderKanban,
  "/studio/media": ImageIcon,
  "/studio/navigation": Globe,
  "/studio/footer": ShieldCheck,
  "/studio/seo": ArrowUpRight,
  "/studio/forms": FileText,
  "/studio/leads": Users,
  "/studio/settings": Settings,
  "/studio/profile": Users,
  "/studio/users": Users,
  "/studio/audit": ShieldCheck,
};

const navigationGroups = [
  {
    title: "Workspace",
    items: STUDIO_NAV_ITEMS.filter((item) => item.group === "Workspace").map((item) => ({ ...item, icon: iconMap[item.href] ?? LayoutDashboard })),
  },
  {
    title: "Studio",
    items: STUDIO_NAV_ITEMS.filter((item) => item.group === "Studio").map((item) => ({ ...item, icon: iconMap[item.href] ?? LayoutDashboard })),
  },
  {
    title: "Access",
    items: STUDIO_NAV_ITEMS.filter((item) => item.group === "Access").map((item) => ({ ...item, icon: iconMap[item.href] ?? LayoutDashboard })),
  },
];

validateStudioNavigation();

export function CmsShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarCounts, setSidebarCounts] = useState<Record<string, number>>({});
  const userRole = session?.user?.role ?? "VIEWER";
  const userName = session?.user?.name ?? "Team Member";

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      try {
        const [blogResponse, leadsResponse, formsResponse] = await Promise.all([
          fetch("/api/cms/blog"),
          fetch("/api/cms/leads"),
          fetch("/api/cms/forms"),
        ]);

        const [blogPayload, leadsPayload, formsPayload] = await Promise.all([
          blogResponse.ok ? blogResponse.json() : Promise.resolve({ items: [] }),
          leadsResponse.ok ? leadsResponse.json() : Promise.resolve({ leads: [] }),
          formsResponse.ok ? formsResponse.json() : Promise.resolve({ forms: [] }),
        ]);

        if (!isMounted) return;

        setSidebarCounts(buildSidebarStatusCounts({
          blog: Array.isArray(blogPayload?.items) ? blogPayload.items : [],
          leads: Array.isArray(leadsPayload?.leads) ? leadsPayload.leads : [],
          forms: Array.isArray(formsPayload?.forms) ? formsPayload.forms : [],
        }));
      } catch {
        if (isMounted) {
          setSidebarCounts({
            "/studio/blog": 0,
            "/studio/leads": 0,
            "/studio/forms": 0,
          });
        }
      }
    }

    void loadCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageActions = action ?? (getStudioPageActions(pathname).length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
      {getStudioPageActions(pathname).map((label) => {
        const actionHref = getStudioActionLink(pathname, label);
        return (
          <Link
            key={label}
            href={actionHref}
            onClick={(event) => {
              if (actionHref.includes("#create-resource-form")) {
                event.preventDefault();
                window.history.pushState(null, "", actionHref);
                window.dispatchEvent(new Event("phause:create-service-open"));
              }
            }}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/15"
          >
            {label}
          </Link>
        );
      })}
    </div>
  ) : null);
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleNavigation = navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.href === "/studio/users" || item.href === "/studio/audit") {
        return userRole === "ADMIN" || userRole === "SUPER_ADMIN";
      }
      return true;
    }),
  }));

  return (
    <div className="min-h-screen bg-[#050b12] text-slate-100">
      <div className="mx-auto flex max-w-[1700px] gap-6 px-4 py-6 lg:px-6">
        <aside
          className={cn(
            "hidden shrink-0 rounded-[28px] border border-slate-800 bg-[#0a1119]/95 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm lg:flex lg:flex-col",
            collapsed ? "w-24" : "w-76",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-teal-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/30">
                P
              </div>
              {!collapsed && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">Phause</div>
                  <div className="text-sm font-semibold text-white">CMS</div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden rounded-lg border border-slate-700 bg-slate-900/70 p-1.5 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 lg:inline-flex"
              aria-label="Toggle navigation"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {visibleNavigation.map((group) => (
              <div key={group.title} className="space-y-2">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-medium uppercase tracking-[0.26em] text-slate-500">{group.title}</p>
                )}

                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || (item.href !== "/studio" && pathname.startsWith(item.href));
                    const statusCount = getSidebarStatusCount(item.href, sidebarCounts);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          active
                            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]"
                            : "border-transparent bg-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/80 hover:text-white",
                          collapsed && "justify-center px-2",
                        )}
                        title={item.label}
                      >
                        <Icon size={16} className={cn(active ? "text-cyan-300" : "text-slate-400 group-hover:text-cyan-300")} />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && statusCount !== null ? (
                          <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                            {statusCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {!collapsed && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-300 text-sm font-bold text-slate-950">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{userName}</div>
                  <div className="truncate text-xs text-slate-400">{userRole}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:text-white"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </aside>

        <div className="flex-1">
          <header className="rounded-[28px] border border-slate-800 bg-[#0b1218]/88 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={16} />
                </button>

                <div className="relative w-full xl:w-[420px]">
                  <input
                    type="search"
                    placeholder="Search content, pages, blog, media..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-2.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <circle cx="11" cy="11" r="6" />
                      <path d="M16 16L21 21" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {pageActions ? <div>{pageActions}</div> : null}
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-2.5 py-2 text-sm text-slate-200">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-300 text-[10px] font-bold text-slate-950">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium text-white">{userName}</div>
                    <div className="text-[10px] text-slate-400">{userRole}</div>
                  </div>
                </div>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/20 hover:text-white"
                >
                  View site
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Administration</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
                {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
              </div>

            </div>
          </header>

          <main className="mt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
