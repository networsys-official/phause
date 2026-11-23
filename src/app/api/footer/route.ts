import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";
import { revalidateTag } from "next/cache";

import { prisma } from "@/infrastructure/database/prisma";
import { normalizeFooterLinks, slugToHref } from "@/features/cms/cms-service";
import { getFooterConfig } from "@/features/cms/content-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET() {
  const footer = await getFooterConfig();
  return NextResponse.json({ success: true, footer });
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`footer:${key}`, 60, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const links = normalizeFooterLinks(payload.links ?? []);

    const footer = await prisma.$transaction(async (tx) => {
      const record = await tx.footer.upsert({
        where: { slug: "main-footer" },
        update: {
          title: String(payload.title ?? "Phause"),
          description: String(payload.description ?? ""),
          copyright: String(payload.copyright ?? ""),
          version: { increment: 1 },
        },
        create: {
          slug: "main-footer",
          title: String(payload.title ?? "Phause"),
          description: String(payload.description ?? ""),
          copyright: String(payload.copyright ?? ""),
          status: "PUBLISHED",
          version: 1,
        },
      });

      await Promise.all(
        links.map(async (item) => {
          let linkedPage = null;
          if (item.pageId) linkedPage = await tx.page.findUnique({ where: { id: item.pageId } });
          const href = linkedPage ? slugToHref(linkedPage.slug) : item.href;
          const existing = item.pageId
            ? await tx.footerLink.findFirst({ where: { footerId: record.id, pageId: item.pageId, deletedAt: null } })
            : item.id
              ? await tx.footerLink.findFirst({ where: { id: item.id, footerId: record.id, deletedAt: null } })
              : await tx.footerLink.findFirst({ where: { footerId: record.id, href, deletedAt: null } });
          const data = {
            label: item.label,
            href,
            position: item.position,
            type: linkedPage ? (item.type ?? "QUICK_LINKS") : (item.href.includes("http") || item.href.startsWith("#") ? "SOCIAL" : "LINK"),
            status: linkedPage ? linkedPage.status : "PUBLISHED" as const,
            pageId: linkedPage?.id ?? null,
          };
          if (existing) {
            await tx.footerLink.update({ where: { id: existing.id }, data });
          } else {
            await tx.footerLink.create({ data: { footerId: record.id, ...data, version: 1 } });
          }
        }),
      );
      return tx.footer.findFirst({ where: { id: record.id }, include: { links: { orderBy: { position: "asc" } } } });
    });

    revalidateTag("cms-footer", "max");
    revalidateTag("cms-pages", "max");
    logger.info("Footer update request received", { title: payload.title ?? "unknown", linkCount: links.length });
    return NextResponse.json({ success: true, footer: { title: footer?.title ?? payload.title ?? "Phause", description: footer?.description ?? payload.description ?? "", copyright: footer?.copyright ?? payload.copyright ?? "", links } });
  } catch (error) {
    logger.error("Footer update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Footer update failed." }, { status: 500 });
  }
}
