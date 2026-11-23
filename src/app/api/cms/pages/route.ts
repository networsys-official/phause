import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";
import { normalizePageInput, normalizeSlug } from "@/features/cms/cms-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { cmsPageCreateUpdateSchema, cmsSaveResponseSchema } from "@/features/cms/cms-page-contract";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";
import { pageMenuInputSchema, syncPageMenuLinks, validatePageSlug, isSystemPageSlug } from "@/features/cms/page-menu-service";

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
    subscriptionFeatures: "SUBSCRIPTION_FEATURES",
    subscriptionFaq: "SUBSCRIPTION_FAQ",
    subscriptionCta: "SUBSCRIPTION_CTA",
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

function normalizeEditableValue(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(normalizeEditableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeEditableValue(item)]));
  }
  return null;
}

function serializePage(page: {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
  seo?: { id: string; title?: string | null; description?: string | null; keywords?: string | null; canonical?: string | null } | null;
  blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown>; version?: number }>;
}) {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    version: page.version,
    seo: page.seo ?? undefined,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      order: block.order,
      props: block.props,
      version: block.version ?? 1,
    })),
  };
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`cms-pages:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

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

function normalizeBlockTypeFromDb(type: string) {
  return pageBlockEnum(type.toLowerCase().replace(/_/g, ""));
}

async function savePageRecord(payload: Record<string, unknown>, mode: "create" | "update") {
  const normalized = normalizePageInput(payload);
  const menu = pageMenuInputSchema.parse(payload);

  const result = await prisma.$transaction(async (tx) => {
    const submittedId = typeof payload.id === "string" ? payload.id : "";
    const page = mode === "update" && submittedId
      ? await tx.page.update({
          where: { id: submittedId },
          data: {
            slug: normalized.slug,
            title: normalized.title,
            status: normalized.status,
            publishedAt: normalized.status === "PUBLISHED" ? new Date() : null,
            version: { increment: 1 },
          },
        })
      : await tx.page.create({
          data: {
            slug: normalized.slug,
            title: normalized.title,
            status: normalized.status,
            publishedAt: normalized.status === "PUBLISHED" ? new Date() : null,
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

    for (const [index, block] of normalized.blocks.entries()) {
      const blockId = typeof block.id === "string" ? block.id : "";
      const blockType = pageBlockEnum(block.type) as never;
      const existingById = blockId ? await tx.pageBlock.findFirst({
        where: { id: blockId, pageId: page.id, deletedAt: null },
      }) : null;
      const existingByType = existingById ? null : await tx.pageBlock.findFirst({
        where: { pageId: page.id, type: blockType, deletedAt: null },
        orderBy: { order: "asc" },
      });
      const existing = existingById ?? existingByType;

      if (existing) {
        await tx.pageBlock.update({
          where: { id: existing.id },
          data: { type: blockType, order: block.order ?? index, props: block.props as never, version: { increment: 1 } },
        });
      } else {
        await tx.pageBlock.create({
          data: { pageId: page.id, type: blockType, order: block.order ?? index, props: block.props as never, version: 1 },
        });
      }
    }

    const savedPage = await tx.page.findFirst({
      where: { id: page.id },
      include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    });

    if (!savedPage) {
      throw new Error("Saved page could not be loaded.");
    }

    await syncPageMenuLinks(tx, savedPage, menu);

    for (const submitted of normalized.blocks) {
      const persisted = savedPage.blocks.find((block) =>
        submitted.id && block.id === submitted.id
          ? true
          : normalizePageInput({ slug: normalized.slug, title: normalized.title, status: normalized.status, blocks: [{ type: submitted.type }] }).blocks[0].type === normalizePageInput({ slug: normalized.slug, title: normalized.title, status: normalized.status, blocks: [{ type: normalizeBlockTypeFromDb(String(block.type)) }] }).blocks[0].type
      );
      if (!persisted) {
        throw new Error(`A submitted section could not be persisted: ${submitted.type}`);
      }
      const persistedProps = normalizeEditableValue(persisted.props);
      const submittedProps = normalizeEditableValue(submitted.props);
      const stableProps = (value: unknown): string => {
        if (Array.isArray(value)) return JSON.stringify(value.map(stableProps));
        if (value && typeof value === "object") {
          return JSON.stringify(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, stableProps((value as Record<string, unknown>)[key])]));
        }
        return JSON.stringify(value);
      };
      if (stableProps(persistedProps) !== stableProps(submittedProps)) {
        throw new Error(`The persisted section did not match the saved value: ${submitted.type}`);
      }
    }

    return serializePage({
      ...savedPage,
      blocks: savedPage.blocks.map((block) => ({ ...block, props: (block.props ?? {}) as Record<string, unknown> })),
    });
  });

  logger.info("CMS page persisted", { mode, slug: result.slug });
  return result;
}

async function requireWriteAccess(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const role = String(session.user.role ?? "VIEWER");
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ success: false, message: "You do not have permission to change pages." }, { status: 403 });
  }
  if (!canAccess(request)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  return null;
}

const pageUpdateSchema = cmsPageCreateUpdateSchema.omit({ starter: true }).extend({ starter: z.unknown().optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"]), seo: z.object({ title: z.string().nullable().optional(), description: z.string().nullable().optional(), keywords: z.union([z.array(z.string()), z.string()]).nullable().optional(), canonical: z.string().nullable().optional() }).optional(), }).extend({})
export async function POST(request: NextRequest) {
  const accessError = await requireWriteAccess(request);
  if (accessError) return accessError;

  try {
    const parsed = cmsPageCreateUpdateSchema.parse(await request.json());
    if (!parsed.slug) {
      return NextResponse.json({ success: false, message: "Page slug is required." }, { status: 400 });
    }
    const normalizedSlug = normalizeSlug(parsed.slug);
    const slugError = validatePageSlug(normalizedSlug);
    if (slugError) return NextResponse.json({ success: false, message: slugError }, { status: 400 });

    const duplicate = await prisma.page.findUnique({ where: { slug: normalizedSlug } });
    if (duplicate) return NextResponse.json({ success: false, message: `A page with slug "${normalizedSlug}" already exists.` }, { status: 409 });

    const starter = String((parsed as { starter?: string }).starter ?? "HERO_TEXT");
    const starterBlocks = parsed.blocks.length ? parsed.blocks : starter === "BLANK"
      ? [{ type: "hero", order: 0, props: { title: parsed.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } }]
      : starter === "HERO_TEXT_CTA"
        ? [
            { type: "hero", order: 0, props: { title: parsed.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } },
            { type: "richText", order: 1, props: { title: "", description: "" } },
            { type: "cta", order: 2, props: { title: "", description: "", buttonText: "", buttonLink: "" } },
          ]
        : [
            { type: "hero", order: 0, props: { title: parsed.title, eyebrow: "", description: "", ctaPrimary: "", ctaPrimaryHref: "" } },
            { type: "richText", order: 1, props: { title: "", description: "" } },
          ];
    const page = await savePageRecord({ ...parsed, slug: normalizedSlug, blocks: starterBlocks }, "create");
    await prisma.auditLog.create({ data: { entityType: "Page", entityId: page.id, action: "CREATE", metadata: { slug: page.slug }, pageId: page.id } });
    revalidateCmsState(page.slug);
    const response = cmsSaveResponseSchema.parse({ success: true, page });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid page data." }, { status: 400 });
    logger.error("Page creation failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page creation failed." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireWriteAccess(request);
  if (accessError) return accessError;

  try {
    const parsed = pageUpdateSchema.parse(await request.json());

    const target = parsed.id
      ? { id: parsed.id }
      : parsed.slug
        ? { slug: normalizeSlug(parsed.slug) }
        : null;

    if (!target) {
      return NextResponse.json({ success: false, message: "Page id or slug is required." }, { status: 400 });
    }

    const existing = await prisma.page.findFirst({
      where: "id" in target ? { id: target.id, deletedAt: null } : { slug: target.slug, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Page not found." }, { status: 404 });
    }

    const normalizedSlug = parsed.slug ? normalizeSlug(parsed.slug) : existing.slug;
    const body = { ...parsed, slug: normalizedSlug };
    const slugChanged = normalizedSlug !== existing.slug;

    if (slugChanged && isSystemPageSlug(existing.slug)) {
      return NextResponse.json({ success: false, message: "The address of a system page is fixed." }, { status: 400 });
    }
    if (slugChanged) {
      const slugError = validatePageSlug(normalizedSlug);
      if (slugError) return NextResponse.json({ success: false, message: slugError }, { status: 400 });
    }

    const slugOwner = await prisma.page.findUnique({ where: { slug: normalizedSlug } });
    if (slugOwner && slugOwner.id !== existing.id) {
      return NextResponse.json({ success: false, message: `A page with slug "${normalizedSlug}" already exists.` }, { status: 409 });
    }

    const submittedVersion = typeof (body as { version?: unknown }).version === "number" ? Number((body as { version?: number }).version) : undefined;
    if (submittedVersion !== undefined && submittedVersion !== existing.version) {
      return NextResponse.json({ success: false, message: "This page changed in another tab. Refresh and try again.", code: "VERSION_CONFLICT", currentVersion: existing.version }, { status: 409 });
    }

    const page = await savePageRecord(body, "update");
    await prisma.auditLog.create({
      data: {
        entityType: "Page",
        entityId: page.id,
        action: "UPDATE",
        metadata: { slug: page.slug, blockCount: page.blocks.length },
        pageId: page.id,
      },
    });
    const response = cmsSaveResponseSchema.parse({ success: true, page });
    revalidateCmsState(page.slug);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid page data." }, { status: 400 });
    logger.error("Page update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page update failed." }, { status: 500 });
  }
}

const patchPageBlockSchema = z.object({
  pageId: z.string().min(1),
  blockId: z.string().min(1),
  fieldPath: z.string().regex(/^[A-Za-z][A-Za-z0-9]*(?:\.(?:[A-Za-z][A-ZaZ0-9]*|\d+))*$/),
  value: z.union([z.string().max(5000), z.number(), z.boolean(), z.null()]),
  version: z.number().int().positive(),
});

function setJsonPath(target: Record<string, unknown>, fieldPath: string, value: unknown) {
  const parts = fieldPath.split(".");
  let cursor: unknown = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const nextKey = parts[index + 1];
    const shouldBeArray = /^\d+$/.test(nextKey);

    if (Array.isArray(cursor)) {
      const arrayIndex = Number(key);
      cursor[arrayIndex] = cursor[arrayIndex] && typeof cursor[arrayIndex] === "object"
        ? cursor[arrayIndex]
        : (shouldBeArray ? [] : {});
      cursor = cursor[arrayIndex];
    } else if (cursor && typeof cursor === "object") {
      const record = cursor as Record<string, unknown>;
      record[key] = record[key] && typeof record[key] === "object"
        ? record[key]
        : (/^\d+$/.test(nextKey) ? [] : {});
      cursor = record[key];
    }
  }

  const last = parts[parts.length - 1];
  if (Array.isArray(cursor)) cursor[Number(last)] = value;
  else if (cursor && typeof cursor === "object") (cursor as Record<string, unknown>)[last] = value;
}

export async function PATCH(request: NextRequest) {
  const accessError = await requireWriteAccess(request);
  if (accessError) return accessError;

  try {
    const parsed = patchPageBlockSchema.parse(await request.json());
    const lowerPath = parsed.fieldPath.toLowerCase();
    if (typeof parsed.value === "string" && (lowerPath.includes("href") || lowerPath.includes("url") || lowerPath.includes("link") || lowerPath.includes("image"))) {
      if (parsed.value && !parsed.value.startsWith("/") && !parsed.value.startsWith("#") && !parsed.value.startsWith("mailto:") && !parsed.value.startsWith("tel:") && !/^https?:\/\/[^\s]+$/i.test(parsed.value)) {
        return NextResponse.json({ success: false, message: "Invalid link or URL." }, { status: 400 });
      }
    }

    const saved = await prisma.$transaction(async (tx) => {
      const page = await tx.page.findFirst({ where: { id: parsed.pageId, deletedAt: null } });
      if (!page) throw new Error("Page not found.");

      const block = await tx.pageBlock.findFirst({ where: { id: parsed.blockId, pageId: parsed.pageId, deletedAt: null } });
      if (!block) throw new Error("Page section not found.");
      if (block.version !== parsed.version) {
        const conflict = new Error("VERSION_CONFLICT");
        Object.assign(conflict, { status: 409, currentVersion: block.version });
        throw conflict;
      }

      const props = JSON.parse(JSON.stringify(block.props ?? {})) as Record<string, unknown>;
      setJsonPath(props, parsed.fieldPath, parsed.value);
      const updated = await tx.pageBlock.update({
        where: { id: block.id },
        data: { props: props as never, version: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: { entityType: "PageBlock", entityId: block.id, action: "UPDATE", metadata: { pageId: page.id, blockId: block.id, fieldPath: parsed.fieldPath }, pageId: page.id },
      });

      return { page, block: updated };
    });

    revalidateCmsState(saved.page.slug);
    const reread = await prisma.page.findFirst({
      where: { id: saved.page.id, deletedAt: null },
      include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    });
    if (!reread) throw new Error("Persisted page could not be loaded.");

    return NextResponse.json({ success: true, page: serializePage({ ...reread, blocks: reread.blocks.map((block) => ({ ...block, props: (block.props ?? {}) as Record<string, unknown> })) }) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid field update." }, { status: 400 });
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      return NextResponse.json({ success: false, message: "This section changed in another tab. Reload latest.", code: "VERSION_CONFLICT" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Field update failed.";
    const status = message === "Page not found." || message === "Page section not found." ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireWriteAccess(request);
  if (accessError) return accessError;

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

    if (isSystemPageSlug(page.slug)) {
      return NextResponse.json({ success: false, message: "System pages cannot be deleted." }, { status: 403 });
    }

    const deletedAt = new Date();
    const deletedPage = await prisma.$transaction(async (tx) => {
      await tx.navigationItem.updateMany({ where: { pageId: page.id, deletedAt: null }, data: { deletedAt } });
      await tx.footerLink.updateMany({ where: { pageId: page.id, deletedAt: null }, data: { deletedAt } });
      const result = await tx.page.update({
        where: { id: page.id },
        data: { deletedAt, status: "ARCHIVED", updatedAt: deletedAt },
      });
      await tx.auditLog.create({ data: { entityType: "Page", entityId: page.id, action: "DELETE", metadata: { slug: page.slug }, pageId: page.id } });
      return result;
    });

    revalidateCmsState(page.slug);
    return NextResponse.json({ success: true, page: deletedPage });
  } catch (error) {
    logger.error("Page delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Page delete failed." }, { status: 500 });
  }
}
