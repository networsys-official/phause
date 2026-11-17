import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const seo = await prisma.seo.findFirst({ where: { slug, deletedAt: null } });
    return NextResponse.json({ success: true, seo });
  }

  const entries = await prisma.seo.findMany({ where: { deletedAt: null }, orderBy: { slug: "asc" } });
  return NextResponse.json({ success: true, entries });
}

export async function PUT(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`seo:${key}`, 60, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const payload = await request.json();
    const entries = Array.isArray(payload.entries) ? payload.entries : [payload];

    const saved = await Promise.all(
      entries.map(async (entry: Record<string, unknown>) => {
        const slug = String(entry.slug ?? "page");
        const seo = await prisma.seo.upsert({
          where: { slug },
          update: {
            title: typeof entry.title === "string" ? entry.title : null,
            description: typeof entry.description === "string" ? entry.description : null,
            keywords: typeof entry.keywords === "string" ? entry.keywords : null,
            canonical: typeof entry.canonical === "string" ? entry.canonical : null,
          },
          create: {
            slug,
            title: typeof entry.title === "string" ? entry.title : null,
            description: typeof entry.description === "string" ? entry.description : null,
            keywords: typeof entry.keywords === "string" ? entry.keywords : null,
            canonical: typeof entry.canonical === "string" ? entry.canonical : null,
          },
        });

        const page = await prisma.page.findFirst({ where: { slug, deletedAt: null } });
        if (page) {
          await prisma.page.update({ where: { id: page.id }, data: { seoId: seo.id } });
        }

        return seo;
      }),
    );

    logger.info("SEO update request received", { count: saved.length });
    return NextResponse.json({ success: true, entries: saved });
  } catch (error) {
    logger.error("SEO update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "SEO update failed." }, { status: 500 });
  }
}
