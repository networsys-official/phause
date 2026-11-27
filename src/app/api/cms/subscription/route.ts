import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const [page, plans] = await Promise.all([
    prisma.page.findFirst({
      where: { slug: "subscription", deletedAt: null },
      include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    }),
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      include: { features: { where: { visible: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const block = page?.blocks.find((entry) => String(entry.type).replace(/[_-]+/g, "").toLowerCase() === "customsection");
  return NextResponse.json({ success: true, page: page ? { title: page.title, slug: page.slug, metaTitle: page.seo?.title ?? null, metaDescription: page.seo?.description ?? null, active: page.status === "PUBLISHED", sectionOrder: (block?.props as Record<string, unknown>)?.page ? ((block?.props as any).page.sectionOrder ?? []) : [] } : null, plans, ...(block?.props as Record<string, unknown> ?? {}) });
}

export async function PUT() {
  return NextResponse.json({ success: false, message: "Use /api/cms/subscription-page" }, { status: 404 });
}
