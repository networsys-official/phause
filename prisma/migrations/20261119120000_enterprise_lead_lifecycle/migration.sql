CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'ASSIGNED',
  'QUALIFIED',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
  'SPAM'
);

ALTER TABLE "Lead"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General Enquiry',
  ADD COLUMN "assignedTo" TEXT,
  DROP COLUMN "publishedAt",
  DROP COLUMN "version",
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus"
    USING (
      CASE "status"::text
        WHEN 'PUBLISHED' THEN 'QUALIFIED'::"LeadStatus"
        WHEN 'SCHEDULED' THEN 'MEETING_SCHEDULED'::"LeadStatus"
        WHEN 'ARCHIVED' THEN 'CLOSED_LOST'::"LeadStatus"
        ELSE 'NEW'::"LeadStatus"
      END
    ),
  ALTER COLUMN "status" SET DEFAULT 'NEW';

CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
