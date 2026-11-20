-- Reconcile the Prisma schema with the committed migration history.

CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'LOCKED');

ALTER TYPE "PageBlockType" ADD VALUE 'CTA_BUTTON';
ALTER TYPE "PageBlockType" ADD VALUE 'CONTACT';
ALTER TYPE "PageBlockType" ADD VALUE 'FORM';

ALTER TABLE "Feature" ADD COLUMN IF NOT EXISTS "image" TEXT;

ALTER TABLE "Footer" DROP COLUMN IF EXISTS "content";
ALTER TABLE "Footer" ADD COLUMN IF NOT EXISTS "copyright" TEXT;
ALTER TABLE "Footer" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Footer" ADD COLUMN IF NOT EXISTS "rowVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "checksum" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "rowVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "size" INTEGER;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "width" INTEGER;
UPDATE "Media" SET "title" = "filename" WHERE "title" IS NULL;
ALTER TABLE "Media" ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "Navigation" ADD COLUMN IF NOT EXISTS "key" TEXT;
ALTER TABLE "Navigation" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Navigation" ADD COLUMN IF NOT EXISTS "rowVersion" INTEGER NOT NULL DEFAULT 0;
UPDATE "Navigation" SET "key" = "slug" WHERE "key" IS NULL OR "key" = '';
ALTER TABLE "Navigation" ALTER COLUMN "key" SET NOT NULL;
ALTER TABLE "Navigation" ALTER COLUMN "href" DROP NOT NULL;

ALTER TABLE "PageBlock" ADD COLUMN IF NOT EXISTS "mediaId" TEXT;

ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "featuredImageId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "ogImageId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "thumbnailImageId" TEXT;

ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "featured";
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "hoverColor";
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "image";
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "slug" DROP NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "buttonText" DROP DEFAULT;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "buttonUrl" DROP DEFAULT;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "icon" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "icon" SET DEFAULT 'shield';

DROP TABLE IF EXISTS "SubscriptionPlanFeature";

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "NavigationItem" (
    "id" TEXT NOT NULL,
    "navigationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FooterLink" (
    "id" TEXT NOT NULL,
    "footerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'LINK',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE INDEX IF NOT EXISTS "NavigationItem_navigationId_position_idx" ON "NavigationItem"("navigationId", "position");
CREATE INDEX IF NOT EXISTS "FooterLink_footerId_position_idx" ON "FooterLink"("footerId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "Media_checksum_key" ON "Media"("checksum");
CREATE INDEX IF NOT EXISTS "Media_status_mimeType_idx" ON "Media"("status", "mimeType");
CREATE INDEX IF NOT EXISTS "Media_checksum_idx" ON "Media"("checksum");
CREATE UNIQUE INDEX IF NOT EXISTS "Navigation_key_key" ON "Navigation"("key");
CREATE INDEX IF NOT EXISTS "Navigation_status_position_idx" ON "Navigation"("status", "position");

ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PageBlock" DROP CONSTRAINT IF EXISTS "PageBlock_mediaId_fkey";
ALTER TABLE "PageBlock" ADD CONSTRAINT "PageBlock_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_featuredImageId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_ogImageId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_thumbnailImageId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_thumbnailImageId_fkey" FOREIGN KEY ("thumbnailImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NavigationItem" DROP CONSTRAINT IF EXISTS "NavigationItem_navigationId_fkey";
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "Navigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FooterLink" DROP CONSTRAINT IF EXISTS "FooterLink_footerId_fkey";
ALTER TABLE "FooterLink" ADD CONSTRAINT "FooterLink_footerId_fkey" FOREIGN KEY ("footerId") REFERENCES "Footer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
