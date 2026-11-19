import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { subscriptionCmsPayloadSchema } from "@/features/cms/subscription-cms-validation";

async function ensureSubscriptionCms() {
  const page = await prisma.subscriptionPage.findUnique({ where: { slug: "subscription" } });
  if (page) return;

  await prisma.$transaction(async (tx) => {
    await tx.subscriptionPage.create({ data: {
      title: "Subscription", slug: "subscription", active: true,
      metaTitle: "Phause | Pricing & Plans",
      metaDescription: "Choose a cybersecurity plan built for your team.",
      ogImage: null,
      sectionOrder: ["hero", "trust", "pricing", "comparison", "faq", "testimonials", "cta"],
    } });
    await tx.subscriptionHeroSection.create({ data: { badgeText: "Pricing & Plans", badgeIcon: "sparkles", badgeVisible: true, heading: "Security that scales with you", highlightedWord: "scales", subtitle: "Choose a cybersecurity plan built for your team.", ctaPrimaryText: "Choose a plan", ctaPrimaryUrl: "#pricing", ctaSecondaryText: "Talk to us", ctaSecondaryUrl: "/contact", visible: true, sortOrder: 0 } });
    await tx.subscriptionTrustItem.createMany({ data: [
      { icon: "badge", title: "SOC 2 Type II Certified", visible: true, sortOrder: 0 },
      { icon: "lock", title: "Zero-Trust Architecture", visible: true, sortOrder: 1 },
      { icon: "globe", title: "40+ Countries Served", visible: true, sortOrder: 2 },
      { icon: "headset", title: "24/7 Human Support", visible: true, sortOrder: 3 },
      { icon: "trend", title: "99.98% Uptime SLA", visible: true, sortOrder: 4 },
    ] });
    await tx.subscriptionPricingSection.create({ data: { title: "Plans that scale with your security", subtitle: "Find the right level of protection.", badgeText: "Pricing", accentColor: "cyan", visible: true, sortOrder: 1 } });
    const free = await tx.subscriptionPlan.create({ data: { name: "Free", description: "For individuals and small teams getting started.", price: "0", yearlyPrice: "0", buttonText: "Start Free", buttonUrl: "/registration", active: true, sortOrder: 0, icon: "shield", accent: "slate" } });
    const starter = await tx.subscriptionPlan.create({ data: { name: "Starter", description: "For growing teams that need more protection.", price: "29", yearlyPrice: "24", popular: true, badge: "Most Popular", buttonText: "Choose Starter", buttonUrl: "/registration", active: true, sortOrder: 1, icon: "rocket", accent: "teal" } });
    await tx.planFeature.createMany({ data: [
      { planId: free.id, text: "Core threat detection", visible: true, sortOrder: 0 },
      { planId: free.id, text: "Community support", visible: true, sortOrder: 1 },
      { planId: starter.id, text: "Behavioral threat detection", visible: true, sortOrder: 0 },
      { planId: starter.id, text: "Automated response playbooks", visible: true, sortOrder: 1 },
    ] });
    await tx.subscriptionComparisonSection.create({ data: { title: "Compare every dimension", subtitle: "Compare limits and features.", visible: true, sortOrder: 2 } });
    await tx.subscriptionComparisonRow.createMany({ data: [{ name: "Maximum users", freeValue: "10", starterValue: "25", professionalValue: "100", businessValue: "500", enterpriseValue: "Unlimited", sortOrder: 0, active: true }] });
    await tx.subscriptionFaqSection.create({ data: { title: "Frequently asked questions", subtitle: "Answers about plans and billing.", visible: true, sortOrder: 3 } });
    await tx.subscriptionFaqItem.create({ data: { question: "Can I switch plans after subscribing?", answer: "Yes. Upgrades take effect instantly and downgrades apply at the start of your next billing cycle.", active: true, sortOrder: 0 } });
    await tx.subscriptionTestimonialSection.create({ data: { title: "Customer stories", subtitle: "Why teams choose Phause.", visible: false, sortOrder: 4 } });
    await tx.subscriptionCtaSection.create({ data: { title: "Still unsure? Talk to a human.", description: "Our security engineers will map your environment to the right tier.", buttonText: "Book a free consultation", buttonUrl: "/contact", visible: true, sortOrder: 5 } });
  });
}

export async function GET() {
  await ensureSubscriptionCms();
  const [page, hero, trustItems, pricing, plans, comparison, comparisonRows, faq, faqs, testimonials, testimonialItems, cta] = await Promise.all([
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
  return NextResponse.json({ success: true, page, hero, trustItems, pricing, plans, comparison, comparisonRows, faq, faqs, testimonials, testimonialItems, cta });
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
    });
    return NextResponse.json({ success: true, message: "Subscription CMS saved." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to save subscription CMS." }, { status: 400 });
  }
}
