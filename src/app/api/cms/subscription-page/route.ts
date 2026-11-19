import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { subscriptionCmsPayloadSchema } from "@/features/cms/subscription-cms-validation";

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

export async function GET() {
  try {
    console.info("[subscription-cms] route:read:start");
    const read = Promise.all([
      prisma.subscriptionPage.findUnique({ where: { slug: "subscription" } }),
      prisma.subscriptionHeroSection.findFirst({ orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionTrustItem.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionPricingSection.findFirst({ orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, include: { features: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } }),
      prisma.subscriptionComparisonSection.findFirst({ orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionComparisonRow.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionFaqSection.findFirst({ orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionFaqItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionTestimonialSection.findFirst({ orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionTestimonialItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.subscriptionCtaSection.findFirst({ orderBy: { sortOrder: "asc" } }),
    ]);

    const [page, hero, trustItems, pricing, plans, comparison, comparisonRows, faq, faqs, testimonials, testimonialItems, cta] = await withTimeout(read, "database read");
    console.info("[subscription-cms] route:read:success");
    return NextResponse.json({ success: true, page, hero, trustItems, pricing, plans, comparison, comparisonRows, faq, faqs, testimonials, testimonialItems, cta });
  } catch (error) {
    console.warn("[subscription-cms] route:read:fallback", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, message: "Subscription CMS unavailable; using fallback content." }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = subscriptionCmsPayloadSchema.parse(await request.json());
    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPage.upsert({ where: { slug: "subscription" }, create: { ...payload.page, sectionOrder: payload.page.sectionOrder ?? [] }, update: { ...payload.page, sectionOrder: payload.page.sectionOrder ?? [] } });
      await tx.subscriptionHeroSection.deleteMany();
      await tx.subscriptionHeroSection.create({ data: payload.hero });
      await tx.subscriptionTrustItem.deleteMany();
      await tx.subscriptionTrustItem.createMany({ data: payload.trustItems });
      await tx.subscriptionPricingSection.deleteMany();
      await tx.subscriptionPricingSection.create({ data: payload.pricing });
      await tx.planFeature.deleteMany();
      await tx.subscriptionPlan.deleteMany();
      for (const [index, plan] of payload.plans.entries()) {
        const created = await tx.subscriptionPlan.create({ data: {
          name: plan.name, badge: plan.badge ?? null, description: plan.description, price: plan.price, yearlyPrice: plan.yearlyPrice ?? null,
          billingCycle: plan.billingCycle, buttonText: plan.buttonText, buttonUrl: plan.buttonUrl, popular: plan.popular, active: plan.active,
          sortOrder: plan.sortOrder ?? index, icon: plan.icon, accent: plan.accent, cardBackground: plan.cardBackground ?? null, badgeColor: plan.badgeColor ?? null, borderColor: plan.borderColor ?? null,
        } });
        if (plan.features.length) await tx.planFeature.createMany({ data: plan.features.map((feature, featureIndex) => ({ planId: created.id, text: feature.text, icon: feature.icon ?? null, visible: feature.visible, sortOrder: feature.sortOrder ?? featureIndex })) });
      }
      await tx.subscriptionComparisonSection.deleteMany(); await tx.subscriptionComparisonSection.create({ data: payload.comparison });
      await tx.subscriptionComparisonRow.deleteMany(); await tx.subscriptionComparisonRow.createMany({ data: payload.comparisonRows });
      await tx.subscriptionFaqSection.deleteMany(); await tx.subscriptionFaqSection.create({ data: payload.faq });
      await tx.subscriptionFaqItem.deleteMany(); await tx.subscriptionFaqItem.createMany({ data: payload.faqs });
      await tx.subscriptionTestimonialSection.deleteMany(); await tx.subscriptionTestimonialSection.create({ data: payload.testimonials });
      await tx.subscriptionTestimonialItem.deleteMany(); await tx.subscriptionTestimonialItem.createMany({ data: payload.testimonialItems });
      await tx.subscriptionCtaSection.deleteMany(); await tx.subscriptionCtaSection.create({ data: payload.cta });
    }, { maxWait: 4000, timeout: 4000 });
    return NextResponse.json({ success: true, message: "Subscription CMS saved." });
  } catch (error) {
    const isTransactionTimeout =
      typeof error === "object" &&
      error !== null &&
      ("code" in error && error.code === "P2028" ||
        "message" in error && typeof error.message === "string" &&
        (/transaction.*timed out|timed out.*transaction/i.test(error.message)));

    if (isTransactionTimeout) {
      return NextResponse.json({ success: false, message: "Subscription CMS update timed out." }, { status: 504 });
    }

    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to save subscription CMS." }, { status: 400 });
  }
}
