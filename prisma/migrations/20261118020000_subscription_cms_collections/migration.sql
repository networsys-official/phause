CREATE TABLE "SubscriptionPlan" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
  "buttonText" TEXT NOT NULL DEFAULT 'Choose Plan',
  "buttonUrl" TEXT NOT NULL DEFAULT '/registration',
  "badge" TEXT,
  "badgeColor" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "cardBackground" TEXT,
  "borderColor" TEXT,
  "hoverColor" TEXT,
  "icon" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_active_sortOrder_idx" ON "SubscriptionPlan"("active", "sortOrder");

CREATE TABLE "SubscriptionPlanFeature" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "featureText" TEXT NOT NULL,
  "featureIcon" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SubscriptionPlanFeature_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionPlanFeature_planId_sortOrder_idx" ON "SubscriptionPlanFeature"("planId", "sortOrder");
ALTER TABLE "SubscriptionPlanFeature" ADD CONSTRAINT "SubscriptionPlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SubscriptionComparisonFeature" (
  "id" TEXT NOT NULL,
  "featureName" TEXT NOT NULL,
  "free" TEXT NOT NULL DEFAULT '',
  "starter" TEXT NOT NULL DEFAULT '',
  "professional" TEXT NOT NULL DEFAULT '',
  "business" TEXT NOT NULL DEFAULT '',
  "enterprise" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "SubscriptionComparisonFeature_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionComparisonFeature_active_sortOrder_idx" ON "SubscriptionComparisonFeature"("active", "sortOrder");

CREATE TABLE "SubscriptionFaq" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionFaq_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionFaq_active_sortOrder_idx" ON "SubscriptionFaq"("active", "sortOrder");

CREATE TABLE "SubscriptionTestimonial" (
  "id" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "designation" TEXT,
  "company" TEXT,
  "image" TEXT,
  "review" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "SubscriptionTestimonial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionTestimonial_active_sortOrder_idx" ON "SubscriptionTestimonial"("active", "sortOrder");

CREATE TABLE "SubscriptionSection" (
  "id" TEXT NOT NULL,
  "sectionType" TEXT NOT NULL,
  "title" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "props" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "SubscriptionSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubscriptionSection_sectionType_key" ON "SubscriptionSection"("sectionType");
CREATE INDEX "SubscriptionSection_enabled_sortOrder_idx" ON "SubscriptionSection"("enabled", "sortOrder");
