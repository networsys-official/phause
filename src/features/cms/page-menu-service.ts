import { z } from "zod";
import type { Prisma, ContentStatus } from "@prisma/client";
import { slugToHref } from "@/features/cms/cms-service";

export const footerGroupSchema = z.enum(["QUICK_LINKS", "SERVICES", "LEGAL"]);

export const pageMenuInputSchema = z.object({
  showInHeader: z.boolean().optional().default(false),
  headerLabel: z.string().trim().max(120).optional().nullable(),
  headerPosition: z.number().int().min(0).optional().default(0),
  showInFooter: z.boolean().optional().default(false),
  footerGroup: footerGroupSchema.optional().default("QUICK_LINKS"),
  footerLabel: z.string().trim().max(120).optional().nullable(),
  footerPosition: z.number().int().min(0).optional().default(0),
});

export type PageMenuInput = z.infer<typeof pageMenuInputSchema>;

export const SYSTEM_PAGE_SLUGS = [
  "home", "about", "contact", "services", "blog", "docs", "faq", "subscription", "registration",
] as const;

export const SYSTEM_PAGE_SLUG_SET = new Set<string>(SYSTEM_PAGE_SLUGS);

export const RESERVED_PAGE_SLUGS = new Set([
  "api", "cms", "studio", "auth", "login", "registration", "_next", "admin",
  "", "home", "about", "services", "blog", "docs", "subscription", "contact", "faq",
  "privacy-policy", "terms-of-service", "how-it-works", "forgot-password", "reset-password", "403", "not-found",
]);

export function isSystemPageSlug(slug: string) {
  return SYSTEM_PAGE_SLUG_SET.has(normalizeSlugValue(slug));
}

function normalizeSlugValue(slug: string) {
  return slug.trim().toLowerCase().replace(/^\//, "").replace(/\/$/, "");
}

export function validatePageSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Use a lowercase URL slug containing only letters, numbers, and hyphens.";
  }
  if (RESERVED_PAGE_SLUGS.has(slug)) {
    return `The slug "${slug}" is reserved by the site and cannot be used.`;
  }
  return null;
}

export function footerTypeToGroup(type: string): "QUICK_LINKS" | "SERVICES" | "LEGAL" | null {
  if (type === "QUICK_LINKS" || type === "SERVICES" || type === "LEGAL") return type;
  return null;
}

export async function syncPageMenuLinks(
  tx: Prisma.TransactionClient,
  page: { id: string; slug: string; title: string; status: ContentStatus },
  menu: PageMenuInput,
) {
  const navigation = await tx.navigation.findFirst({ where: { key: "main", deletedAt: null } });
  if (navigation) {
    const existing = await tx.navigationItem.findFirst({ where: { navigationId: navigation.id, pageId: page.id, deletedAt: null } });
    const label = menu.headerLabel?.trim() || page.title;
    if (menu.showInHeader) {
      if (existing) {
        await tx.navigationItem.update({ where: { id: existing.id }, data: { label, href: slugToHref(page.slug), position: menu.headerPosition, status: page.status, deletedAt: null } });
      } else {
        await tx.navigationItem.create({ data: { navigationId: navigation.id, pageId: page.id, label, href: slugToHref(page.slug), position: menu.headerPosition, status: page.status, version: 1 } });
      }
    } else if (existing) {
      await tx.navigationItem.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    }
  }

  const footer = await tx.footer.findFirst({ where: { slug: "main-footer", deletedAt: null } });
  if (footer) {
    const existing = await tx.footerLink.findFirst({ where: { footerId: footer.id, pageId: page.id, deletedAt: null } });
    const label = menu.footerLabel?.trim() || page.title;
    if (menu.showInFooter) {
      if (existing) {
        await tx.footerLink.update({ where: { id: existing.id }, data: { label, href: slugToHref(page.slug), position: menu.footerPosition, type: menu.footerGroup, status: page.status, deletedAt: null } });
      } else {
        await tx.footerLink.create({ data: { footerId: footer.id, pageId: page.id, label, href: slugToHref(page.slug), position: menu.footerPosition, type: menu.footerGroup, status: page.status, version: 1 } });
      }
    } else if (existing) {
      await tx.footerLink.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    }
  }
}
