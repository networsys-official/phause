import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { normalizePageInput, normalizeSlug } from "@/features/cms/cms-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

function pageBlockEnum(type: string) {
  const record: Record<string, string> = {
    hero: "HERO",
    cta: "CTA",
    ctaButton: "CTA_BUTTON",
    features: "FEATURES",
    services: "SERVICES",
    servicesHero: "SERVICES_HERO",
    servicesFeatures: "SERVICES_FEATURES",
    servicesProcess: "SERVICES_PROCESS",
    servicesAudiences: "SERVICES_AUDIENCES",
    servicesBenefits: "SERVICES_BENEFITS",
    servicesStats: "SERVICES_STATS",
    servicesFaq: "SERVICES_FAQ",
    servicesCta: "SERVICES_CTA",
    homePhilosophy: "HOME_PHILOSOPHY",
    homeReasons: "HOME_REASONS",
    homeServices: "HOME_SERVICES",
    homeOffers: "HOME_OFFERS",
    homeProcess: "HOME_PROCESS",
    homeCta: "HOME_CTA",
    aboutCapabilities: "ABOUT_CAPABILITIES",
    aboutValues: "ABOUT_VALUES",
    aboutCommitments: "ABOUT_COMMITMENTS",
    aboutTimeline: "ABOUT_TIMELINE",
    testimonials: "TESTIMONIALS",
    gallery: "GALLERY",
    faq: "FAQ",
    stats: "STATS",
    pricing: "PRICING",
    team: "TEAM",
    richText: "RICHTEXT",
    video: "VIDEO",
    contact: "CONTACT",
    form: "FORM",
    customSection: "CUSTOM_SECTION",
  };

  const key = String(type ?? "").trim();
  if (!key) return "FEATURES";

  const normalizedLookup: Record<string, string> = {};
  for (const [candidate, value] of Object.entries(record)) {
    normalizedLookup[candidate.toLowerCase()] = value;
    normalizedLookup[candidate.replace(/[^a-z0-9]+/gi, "").toLowerCase()] = value;
  }

  const compact = key.replace(/[^a-z0-9]+/gi, "").toLowerCase();
  return record[key] ?? normalizedLookup[key.toLowerCase()] ?? normalizedLookup[compact] ?? "FEATURES";
}

function serializePage(page: {
  id: string;
  slug: string;
  title: string;
  status: string;
  seo?: { id: string; title?: string | null; description?: string | null; keywords?: string | null; canonical?: string | null } | null;
  blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }>;
}) {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    seo: page.seo ?? undefined,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      order: block.order,
      props: block.props,
    })),
  };
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`cms-pages:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  await ensureDefaultCmsContent();
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const page = await prisma.page.findFirst({
      where: { slug: normalizeSlug(slug), deletedAt: null },
      include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, page: page ? serializePage({ ...page, blocks: page.blocks.map((block) => ({ ...block, props: (block.props ?? {}) as Record<string, unknown> })) }) : null });
  }

  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
  });

  return NextResponse.json({
    success: true,
    pages: pages.map((page) => serializePage({ ...page, blocks: page.blocks.map((block) => ({ ...block, props: (block.props ?? {}) as Record<string, unknown> })) })),
  });
}

async function savePageRecord(payload: Record<string, unknown>, mode: "create" | "update") {
  const normalized = normalizePageInput(payload);

  const result = await prisma.$transaction(async (tx) => {
    const page = await tx.page.upsert({
      where: { slug: normalized.slug },
      update: {
        title: normalized.title,
        status: normalized.status,
        version: { increment: 1 },
      },
      create: {
        slug: normalized.slug,
        title: normalized.title,
        status: normalized.status,
        version: 1,
      },
    });

    const seo = await tx.seo.upsert({
      where: { slug: normalized.slug },
      update: {
        title: normalized.seo?.title ?? normalized.title,
        description: normalized.seo?.description ?? null,
        keywords: normalized.seo?.keywords?.join(",") ?? null,
        canonical: normalized.seo?.canonical ?? null,
      },
      create: {
        slug: normalized.slug,
        title: normalized.seo?.title ?? normalized.title,
        description: normalized.seo?.description ?? null,
        keywords: normalized.seo?.keywords?.join(",") ?? null,
        canonical: normalized.seo?.canonical ?? null,
      },
    });

    await tx.page.update({ where: { id: page.id }, data: { seoId: seo.id } });
    await tx.pageBlock.deleteMany({ where: { pageId: page.id } });

    if (normalized.blocks.length > 0) {
      await tx.pageBlock.createMany({
        data: normalized.blocks.map((block, index) => ({
          pageId: page.id,
          type: pageBlockEnum(block.type) as never,
          order: block.order ?? index,
          props: block.props as Prisma.InputJsonValue,
        })),
      });
    }

    const savedPage = await tx.page.findFirst({
      where: { id: page.id },
      include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    });

    if (!savedPage) {
      throw new Error("Saved page could not be loaded.");
    }

    return serializePage({
      ...savedPage,
      blocks: savedPage.blocks.map((block) => ({ ...block, props: (block.props ?? {}) as Record<string, unknown> })),
    });
  });

  logger.info("CMS page persisted", { mode, slug: result.slug });
  return result;
}

export async function POST(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const page = await savePageRecord(body, "create");
    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (error) {
    logger.error("Page creation failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page creation failed." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const target = (body as { id?: string; slug?: string })?.id
      ? { id: String((body as { id?: string }).id) }
      : { slug: normalizeSlug(String((body as { slug?: string }).slug ?? (body as { title?: string }).title ?? "page")) };

    const existing = await prisma.page.findFirst({ where: target.id ? { id: target.id, deletedAt: null } : { slug: target.slug, deletedAt: null } });

    if (!existing && !target.slug) {
      return NextResponse.json({ success: false, message: "Page not found." }, { status: 404 });
    }

    const page = await savePageRecord(body, "update");
    return NextResponse.json({ success: true, page });
  } catch (error) {
    logger.error("Page update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page update failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const slug = String((body as { slug?: string }).slug ?? request.nextUrl.searchParams.get("slug") ?? "");

    if (!slug) {
      return NextResponse.json({ success: false, message: "Page slug is required." }, { status: 400 });
    }

    const page = await prisma.page.findFirst({ where: { slug: normalizeSlug(slug), deletedAt: null } });
    if (!page) {
      return NextResponse.json({ success: false, message: "Page not found." }, { status: 404 });
    }

    const deletedPage = await prisma.page.update({
      where: { id: page.id },
      data: { deletedAt: new Date(), status: "ARCHIVED", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, page: deletedPage });
  } catch (error) {
    logger.error("Page delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page delete failed." }, { status: 500 });
  }
}
