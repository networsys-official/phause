import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { subscriptionCmsPayloadSchema } from "@/features/cms/subscription-cms-validation";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

const CMS_READ_TIMEOUT_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Subscription CMS ${label} timed out after ${CMS_READ_TIMEOUT_MS}ms`)), CMS_READ_TIMEOUT_MS);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function loadCanonicalPayload() {
  const page = await prisma.page.findFirst({
    where: { slug: "subscription", deletedAt: null },
    include: { seo: true, blocks: { where: { type: "CUSTOM_SECTION", deletedAt: null }, orderBy: { order: "asc" }, take: 1 } },
  });
  const block = page?.blocks[0];
  return block?.props ? block.props as Record<string, unknown> : null;
}

export async function GET() {
  try {
    console.info("[subscription-cms] route:read:start");
    const payload = await withTimeout(loadCanonicalPayload(), "database read");
    if (!payload) return NextResponse.json({ success: false, message: "Subscription CMS has not been seeded." }, { status: 200 });
    return NextResponse.json({ success: true, ...payload, plans: await prisma.subscriptionPlan.findMany({ where: { active: true }, include: { features: { where: { visible: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }) });
  } catch (error) {
    console.warn("[subscription-cms] route:read:fallback", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, message: "Subscription CMS unavailable; using fallback content." }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = subscriptionCmsPayloadSchema.parse(await request.json());
    await prisma.$transaction(async (tx) => {
      const livePage = await tx.page.findFirst({ where: { slug: "subscription", deletedAt: null }, include: { seo: true } });
      if (!livePage) throw new Error("Subscription page not found.");

      const metaTitle = payload.page.metaTitle?.trim() || payload.page.title;
      const metaDescription = payload.page.metaDescription?.trim() || null;
      const seo = await tx.seo.upsert({
        where: { slug: "subscription" },
        update: { title: metaTitle, description: metaDescription, status: "PUBLISHED" },
        create: { slug: "subscription", title: metaTitle, description: metaDescription, status: "PUBLISHED" },
      });

      await tx.page.update({
        where: { id: livePage.id },
        data: { title: payload.page.title, status: payload.page.active ? "PUBLISHED" : "DRAFT", seoId: seo.id, version: { increment: 1 } },
      });

      const blockProps = JSON.parse(JSON.stringify({
        page: payload.page,
        hero: payload.hero,
        trustItems: payload.trustItems,
        pricing: payload.pricing,
        comparison: payload.comparison,
        comparisonRows: payload.comparisonRows,
        faq: payload.faq,
        faqs: payload.faqs,
        testimonials: payload.testimonials,
        testimonialItems: payload.testimonialItems,
        cta: payload.cta,
      })) as never;

      const block = await tx.pageBlock.findFirst({ where: { pageId: livePage.id, type: "CUSTOM_SECTION", deletedAt: null }, orderBy: { order: "asc" } });
      if (block) {
        await tx.pageBlock.update({ where: { id: block.id }, data: { props: blockProps, version: { increment: 1 } } });
      } else {
        await tx.pageBlock.create({ data: { pageId: livePage.id, type: "CUSTOM_SECTION", order: 0, props: blockProps, version: 1 } });
      }
    }, { maxWait: 4000, timeout: 8000 });
    revalidateCmsState("subscription");
    return NextResponse.json({ success: true, message: "Subscription CMS saved." });
  } catch (error) {
    const isTransactionTimeout = typeof error === "object" && error !== null && ("code" in error && error.code === "P2028" || "message" in error && typeof error.message === "string" && /transaction.*timed out|timed out.*transaction/i.test(error.message));
    if (isTransactionTimeout) return NextResponse.json({ success: false, message: "Subscription CMS update timed out." }, { status: 504 });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to save subscription CMS." }, { status: 400 });
  }
}
