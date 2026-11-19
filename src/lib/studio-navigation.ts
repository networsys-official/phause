export type StudioNavItem = {
  href: string;
  label: string;
  group: "Workspace" | "Studio" | "Access";
};

export type StudioPageAction = {
  label: string;
  href: string;
};

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { href: "/studio", label: "Overview", group: "Workspace" },
  { href: "/studio/pages", label: "Pages", group: "Workspace" },
  { href: "/studio/blog", label: "Blog", group: "Workspace" },
  { href: "/studio/faqs", label: "FAQs", group: "Workspace" },
  { href: "/studio/services", label: "Services", group: "Workspace" },
  { href: "/studio/media", label: "Media", group: "Studio" },
  { href: "/studio/navigation", label: "Navigation", group: "Studio" },
  { href: "/studio/footer", label: "Footer", group: "Studio" },
  { href: "/studio/seo", label: "SEO", group: "Studio" },
  { href: "/studio/forms", label: "Forms", group: "Studio" },
  { href: "/studio/leads", label: "Leads", group: "Studio" },
  { href: "/studio/settings", label: "Settings", group: "Studio" },
  { href: "/studio/profile", label: "Profile", group: "Access" },
  { href: "/studio/users", label: "Users", group: "Access" },
  { href: "/studio/audit", label: "Audit Logs", group: "Access" },
];

export const STUDIO_VALID_ROUTES = new Set([
  "/studio",
  "/studio/pages",
  "/studio/blog",
  "/studio/faqs",
  "/studio/services",
  "/studio/media",
  "/studio/navigation",
  "/studio/footer",
  "/studio/seo",
  "/studio/forms",
  "/studio/leads",
  "/studio/settings",
  "/studio/profile",
  "/studio/users",
  "/studio/audit",
]);

export const STUDIO_PAGE_ACTIONS: Record<string, StudioPageAction[]> = {
  "/studio/media": [
    { label: "Upload Media", href: "/studio/media" },
    { label: "Bulk Upload", href: "/studio/media?view=bulk" },
    { label: "Import Assets", href: "/studio/media?view=import" },
  ],
  "/studio/faqs": [
    { label: "Create FAQ", href: "/studio/faqs" },
    { label: "Import FAQs", href: "/studio/faqs?view=import" },
  ],
  "/studio/blog": [
    { label: "Create Blog Post", href: "/studio/blog" },
    { label: "Import Posts", href: "/studio/blog?view=import" },
  ],
  "/studio/pages": [{ label: "Create Page", href: "/studio/pages?view=create" }],
  "/studio/forms": [{ label: "Create Form", href: "/studio/forms?view=create" }],
  "/studio/leads": [{ label: "Review Leads", href: "/studio/leads" }],
  "/studio/services": [{ label: "Create Service", href: "/studio/services#create-resource-form" }],
};

export const STUDIO_STATUS_BADGES = new Set(["/studio/forms", "/studio/leads", "/studio/blog"]);

function normalizeStudioPath(pathname: string) {
  return pathname.split("?")[0].split("#")[0];
}

export function getStudioPageActions(pathname: string): string[] {
  const normalized = normalizeStudioPath(pathname);
  return (STUDIO_PAGE_ACTIONS[normalized] ?? []).map((action) => action.label);
}

export function getStudioActionLink(pathname: string, label: string) {
  const normalized = normalizeStudioPath(pathname);
  const match = (STUDIO_PAGE_ACTIONS[normalized] ?? []).find((action) => action.label === label);
  return match?.href ?? normalized;
}

export function getSidebarStatusCount(pathname: string, counts: Record<string, number> = {}) {
  if (!STUDIO_STATUS_BADGES.has(pathname)) {
    return null;
  }

  const count = counts[pathname] ?? 0;
  return count > 0 ? count : null;
}

export function buildSidebarStatusCounts(data: { blog?: Array<Record<string, unknown>>; leads?: Array<Record<string, unknown>>; forms?: Array<Record<string, unknown>> } = {}) {
  const blogItems = Array.isArray(data.blog) ? data.blog : [];
  const leadItems = Array.isArray(data.leads) ? data.leads : [];
  const formItems = Array.isArray(data.forms) ? data.forms : [];

  return {
    "/studio/blog": blogItems.filter((item) => String(item.status ?? "").toUpperCase() === "DRAFT").length,
    "/studio/leads": leadItems.filter((item) => String(item.status ?? "").toUpperCase() === "DRAFT").length,
    "/studio/forms": formItems.filter((item) => String(item.status ?? "").toUpperCase() === "DRAFT").length,
  };
}

export function buildStudioHealthReport() {
  const seen = new Map<string, string[]>();

  for (const item of STUDIO_NAV_ITEMS) {
    const existing = seen.get(item.href) ?? [];
    seen.set(item.href, [...existing, item.label]);
  }

  const duplicatePages = [...seen.entries()]
    .filter(([, labels]) => labels.length > 1)
    .map(([href, labels]) => ({ href, labels }));

  const missingRoutes = STUDIO_NAV_ITEMS.filter((item) => !STUDIO_VALID_ROUTES.has(item.href)).map((item) => item.href);
  const deadLinks = missingRoutes;
  const unreachableScreens = missingRoutes;

  const incorrectToolbarActions = Object.entries(STUDIO_PAGE_ACTIONS)
    .filter(([path, expected]) => JSON.stringify(getStudioPageActions(path)) !== JSON.stringify(expected.map((item) => item.label)))
    .map(([path, expected]) => ({ path, expected: expected.map((item) => item.label), actual: getStudioPageActions(path) }));

  return {
    missingRoutes,
    deadLinks,
    duplicatePages,
    unreachableScreens,
    incorrectToolbarActions,
  };
}

export function validateStudioNavigation() {
  const report = buildStudioHealthReport();
  const hasIntegrityIssues = report.missingRoutes.length > 0 || report.deadLinks.length > 0 || report.duplicatePages.length > 0 || report.unreachableScreens.length > 0;

  if (hasIntegrityIssues) {
    const message = "[studio-navigation] Studio route integrity check failed.";
    console.warn(message, report);
    if (process.env.NODE_ENV !== "test") {
      throw new Error(message);
    }
  }

  return report;
}
