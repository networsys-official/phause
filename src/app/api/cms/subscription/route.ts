import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "plan";
}

export async function GET() {
  const [sections, plans, comparisons, faqs, testimonials] = await Promise.all([
    prisma.subscriptionSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subscriptionPlan.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: { features: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.subscriptionComparisonFeature.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subscriptionFaq.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subscriptionTestimonial.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({ success: true, sections, plans, comparisons, faqs, testimonials });
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();

    await prisma.$transaction(async (tx) => {
      if (Array.isArray(payload.sections)) {
        await tx.subscriptionSection.deleteMany();
        await tx.subscriptionSection.createMany({
          data: payload.sections.map((item: Record<string, unknown>, index: number) => ({
            sectionType: String(item.sectionType ?? "hero"),
            title: typeof item.title === "string" ? item.title : null,
            enabled: item.enabled !== false,
            sortOrder: Number(item.sortOrder ?? index),
            props: (item.props ?? {}) as object,
          })),
        });
      }

      if (Array.isArray(payload.plans)) {
        await tx.planFeature.deleteMany();
        await tx.subscriptionPlan.deleteMany();
        for (const [index, plan] of payload.plans.entries()) {
          const record = plan as Record<string, unknown>;
          const planRecord = await tx.subscriptionPlan.create({
            data: {
              name: String(record.name ?? "Untitled Plan"),
              description: typeof record.description === "string" ? record.description : "",
              price: String(record.price ?? "0"),
              yearlyPrice: typeof record.yearlyPrice === "string" ? record.yearlyPrice : null,
              billingCycle: String(record.billingCycle ?? "MONTHLY"),
              buttonText: String(record.buttonText ?? "Choose Plan"),
              buttonUrl: String(record.buttonUrl ?? "\/registration"),
              badge: typeof record.badge === "string" ? record.badge : null,
              badgeColor: typeof record.badgeColor === "string" ? record.badgeColor : null,
              popular: record.featured === true || record.popular === true,
              active: record.active !== false,
              sortOrder: Number(record.sortOrder ?? index),
              cardBackground: typeof record.cardBackground === "string" ? record.cardBackground : null,
              borderColor: typeof record.borderColor === "string" ? record.borderColor : null,
              icon: typeof record.icon === "string" ? record.icon : "shield",
              accent: typeof record.accent === "string" ? record.accent : "cyan",
            },
          });

          if (Array.isArray(record.features)) {
            await tx.planFeature.createMany({
              data: record.features.map((feature: Record<string, unknown>, featureIndex: number) => ({
                planId: planRecord.id,
                text: String(feature.featureText ?? feature.text ?? feature.title ?? ""),
                icon: typeof (feature.featureIcon ?? feature.icon) === "string" ? String(feature.featureIcon ?? feature.icon) : null,
                visible: feature.visible !== false && feature.active !== false,
                sortOrder: Number(feature.sortOrder ?? featureIndex),
              })),
            });
          }
        }
      }

      if (Array.isArray(payload.comparisons)) {
        await tx.subscriptionComparisonFeature.deleteMany();
        await tx.subscriptionComparisonFeature.createMany({
          data: payload.comparisons.map((item: Record<string, unknown>, index: number) => ({
            featureName: String(item.featureName ?? item.name ?? ""),
            free: String(item.free ?? ""), starter: String(item.starter ?? ""), professional: String(item.professional ?? ""),
            business: String(item.business ?? ""), enterprise: String(item.enterprise ?? ""),
            sortOrder: Number(item.sortOrder ?? index), active: item.active !== false,
          })),
        });
      }

      if (Array.isArray(payload.faqs)) {
        await tx.subscriptionFaq.deleteMany();
        await tx.subscriptionFaq.createMany({
          data: payload.faqs.map((item: Record<string, unknown>, index: number) => ({
            question: String(item.question ?? ""), answer: String(item.answer ?? ""),
            active: item.active !== false, sortOrder: Number(item.sortOrder ?? index),
            updatedAt: new Date(),
          })),
        });
      }

      if (Array.isArray(payload.testimonials)) {
        await tx.subscriptionTestimonial.deleteMany();
        await tx.subscriptionTestimonial.createMany({
          data: payload.testimonials.map((item: Record<string, unknown>, index: number) => ({
            customerName: String(item.customerName ?? ""), designation: typeof item.designation === "string" ? item.designation : null,
            company: typeof item.company === "string" ? item.company : null, image: typeof item.image === "string" ? item.image : null,
            review: String(item.review ?? ""), rating: Number(item.rating ?? 5), active: item.active !== false,
            sortOrder: Number(item.sortOrder ?? index),
          })),
        });
      }
    });

    return NextResponse.json({ success: true, message: "Subscription CMS updated" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update subscription CMS" }, { status: 400 });
  }
}
