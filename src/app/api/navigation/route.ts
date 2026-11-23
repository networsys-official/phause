import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/infrastructure/database/prisma";
import { normalizeNavigationItems, slugToHref } from "@/features/cms/cms-service";
import { getNavigationConfig } from "@/features/cms/content-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET() {
  const navigation = await getNavigationConfig();
  return NextResponse.json({ success: true, navigation });
}

export async function PUT(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`navigation:${key}`, 60, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const navKey = String(payload.key ?? "main");
    const items = normalizeNavigationItems(payload.items ?? []);

    await prisma.$transaction(async (tx) => {
      const record = await tx.navigation.upsert({
        where: { key: navKey },
        update: { label: String(payload.label ?? "Main navigation"), href: "/", position: 0, version: { increment: 1 } },
        create: { key: navKey, label: String(payload.label ?? "Main navigation"), href: "/", position: 0, slug: `${navKey}-navigation`, status: "PUBLISHED", version: 1 },
      });

      await Promise.all(
        items.map(async (item) => {
          let linkedPage = null;
          if (item.pageId) linkedPage = await tx.page.findUnique({ where: { id: item.pageId } });
          const href = linkedPage ? slugToHref(linkedPage.slug) : item.href;
          const existingItem = item.pageId
            ? await tx.navigationItem.findFirst({ where: { navigationId: record.id, pageId: item.pageId, deletedAt: null } })
            : item.id
              ? await tx.navigationItem.findFirst({ where: { id: item.id, navigationId: record.id, deletedAt: null } })
              : await tx.navigationItem.findFirst({ where: { navigationId: record.id, href, deletedAt: null } });

          if (existingItem) {
            await tx.navigationItem.update({
              where: { id: existingItem.id },
              data: { label: item.label, href, position: item.position, status: linkedPage ? linkedPage.status : "PUBLISHED", pageId: linkedPage?.id ?? null },
            });
          } else {
            await tx.navigationItem.create({
              data: { navigationId: record.id, label: item.label, href, position: item.position, status: linkedPage ? linkedPage.status : "PUBLISHED", pageId: linkedPage?.id ?? null },
            });
          }
        }),
      );

      return tx.navigation.findFirst({
        where: { id: record.id },
        include: { items: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
      });
    });

    revalidateTag("cms-navigation", "max");
    revalidateTag("cms-pages", "max");
    logger.info("Navigation update request received", { key: navKey, itemCount: items.length });
    return NextResponse.json({ success: true, navigation: { key: navKey, label: payload.label ?? "Main navigation", items } });
  } catch (error) {
    logger.error("Navigation update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Navigation update failed." }, { status: 500 });
  }
}

export const revalidate = 60;
