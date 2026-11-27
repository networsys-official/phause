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
  const blockProps = (block?.props ?? {}) as Record<string, unknown>;
  const pagePayload = blockProps.page && typeof blockProps.page === "object"
    ? blockProps.page as { sectionOrder?: unknown }
    : null;
  const sectionOrder = Array.isArray(pagePayload?.sectionOrder)
    ? pagePayload.sectionOrder.filter((entry): entry is string => typeof entry === "string")
    : [];
  return NextResponse.json({ success: true, page: page ? { title: page.title, slug: page.slug, metaTitle: page.seo?.title ?? null, metaDescription: page.seo?.description ?? null, active: page.status === "PUBLISHED", sectionOrder } : null, plans, ...blockProps });
}

export async function PUT() {
  return NextResponse.json({ success: false, message: "Use /api/cms/subscription-page" }, { status: 404 });
}
