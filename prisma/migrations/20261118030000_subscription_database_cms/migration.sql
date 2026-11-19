CREATE TABLE "SubscriptionPage" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "ogImage" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sectionOrder" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubscriptionPage_slug_key" ON "SubscriptionPage"("slug");

CREATE TABLE "SubscriptionHeroSection" (
  "id" TEXT NOT NULL,
  "badgeText" TEXT NOT NULL,
  "badgeIcon" TEXT NOT NULL DEFAULT 'sparkles',
  "badgeVisible" BOOLEAN NOT NULL DEFAULT true,
  "heading" TEXT NOT NULL,
  "highlightedWord" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "backgroundImage" TEXT,
  "ctaPrimaryText" TEXT NOT NULL,
  "ctaPrimaryUrl" TEXT NOT NULL,
  "ctaSecondaryText" TEXT,
  "ctaSecondaryUrl" TEXT,
  "accentColor" TEXT NOT NULL DEFAULT 'cyan',
  "overlayColor" TEXT NOT NULL DEFAULT '#05090f',
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionHeroSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionTrustItem" (
  "id" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'badge',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionTrustItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPricingSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "badgeText" TEXT,
  "accentColor" TEXT NOT NULL DEFAULT 'cyan',
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionPricingSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "badge" TEXT,
  "description" TEXT NOT NULL,
  "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "yearlyPrice" DECIMAL(65,30),
  "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
  "buttonText" TEXT NOT NULL DEFAULT 'Choose Plan',
  "buttonUrl" TEXT NOT NULL DEFAULT '/registration',
  "popular" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "icon" TEXT NOT NULL DEFAULT 'shield',
  "accent" TEXT NOT NULL DEFAULT 'cyan',
  "cardBackground" TEXT,
  "badgeColor" TEXT,
  "borderColor" TEXT,
  CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_active_sortOrder_idx" ON "SubscriptionPlan"("active", "sortOrder");

CREATE TABLE IF NOT EXISTS "PlanFeature" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "icon" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlanFeature_planId_sortOrder_idx" ON "PlanFeature"("planId", "sortOrder");
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SubscriptionComparisonSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionComparisonSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionComparisonRow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "freeValue" TEXT NOT NULL,
  "starterValue" TEXT NOT NULL,
  "professionalValue" TEXT NOT NULL,
  "businessValue" TEXT NOT NULL,
  "enterpriseValue" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "SubscriptionComparisonRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionFaqSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionFaqSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionFaqItem" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "SubscriptionFaqItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionFaqItem_active_sortOrder_idx" ON "SubscriptionFaqItem"("active", "sortOrder");

CREATE TABLE "SubscriptionTestimonialSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionTestimonialSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionTestimonialItem" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "designation" TEXT,
  "image" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "review" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionTestimonialItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionTestimonialItem_active_sortOrder_idx" ON "SubscriptionTestimonialItem"("active", "sortOrder");

CREATE TABLE "SubscriptionCtaSection" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "buttonText" TEXT NOT NULL,
  "buttonUrl" TEXT NOT NULL,
  "backgroundImage" TEXT,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionCtaSection_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "accent" TEXT NOT NULL DEFAULT 'cyan';
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "description" DROP DEFAULT;
