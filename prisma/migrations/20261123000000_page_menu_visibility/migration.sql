ALTER TABLE "NavigationItem" ADD COLUMN IF NOT EXISTS "pageId" TEXT;
ALTER TABLE "FooterLink" ADD COLUMN IF NOT EXISTS "pageId" TEXT;

CREATE INDEX IF NOT EXISTS "NavigationItem_pageId_idx" ON "NavigationItem"("pageId");
CREATE INDEX IF NOT EXISTS "FooterLink_pageId_idx" ON "FooterLink"("pageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'NavigationItem_pageId_fkey'
  ) THEN
    ALTER TABLE "NavigationItem"
      ADD CONSTRAINT "NavigationItem_pageId_fkey"
      FOREIGN KEY ("pageId") REFERENCES "Page"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FooterLink_pageId_fkey'
  ) THEN
    ALTER TABLE "FooterLink"
      ADD CONSTRAINT "FooterLink_pageId_fkey"
      FOREIGN KEY ("pageId") REFERENCES "Page"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill exact href matches. Existing menu rows remain otherwise unchanged.
UPDATE "NavigationItem" AS item
SET "pageId" = page."id"
FROM "Page" AS page
WHERE item."pageId" IS NULL
  AND (
    item."href" = (CASE WHEN page."slug" = 'home' THEN '/' ELSE '/' || page."slug" END)
    OR item."href" = page."slug"
  );

UPDATE "FooterLink" AS item
SET "pageId" = page."id"
FROM "Page" AS page
WHERE item."pageId" IS NULL
  AND (
    item."href" = (CASE WHEN page."slug" = 'home' THEN '/' ELSE '/' || page."slug" END)
    OR item."href" = page."slug"
  );
