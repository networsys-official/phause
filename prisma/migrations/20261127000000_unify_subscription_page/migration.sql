-- Canonicalize Subscription CMS into Page + Seo + one CUSTOM_SECTION PageBlock.
-- Preserve existing SubscriptionPage and dedicated section data where present,
-- then remove the duplicate SubscriptionPage table.

DO $$
DECLARE
  page_id TEXT;
  seo_id TEXT;
  old_page RECORD;
  block_id TEXT;
  hero_json JSONB;
  trust_json JSONB;
  pricing_json JSONB;
  plans_json JSONB;
  comparison_json JSONB;
  comparison_rows_json JSONB;
  faq_json JSONB;
  faqs_json JSONB;
  testimonials_json JSONB;
  testimonial_items_json JSONB;
  cta_json JSONB;
  props_json JSONB;
BEGIN
  SELECT * INTO old_page FROM "SubscriptionPage" WHERE slug = 'subscription' LIMIT 1;

  INSERT INTO "Page" (id, slug, title, status, "createdAt", "updatedAt", version)
  VALUES (COALESCE(old_page.id, 'subscription-canonical'), 'subscription', COALESCE(old_page.title, 'Subscription'), 'PUBLISHED', NOW(), NOW(), 1)
  ON CONFLICT (slug) DO UPDATE SET
    title = CASE WHEN COALESCE(old_page.title, '') <> '' THEN old_page.title ELSE "Page".title END,
    status = 'PUBLISHED',
    "updatedAt" = NOW();

  SELECT id INTO page_id FROM "Page" WHERE slug = 'subscription';

  INSERT INTO "Seo" (id, slug, title, description, status, "createdAt", "updatedAt")
  VALUES (COALESCE(old_page.id, 'subscription-seo-canonical'), 'subscription', COALESCE(old_page."metaTitle", old_page.title, 'Subscription'), old_page."metaDescription", 'PUBLISHED', NOW(), NOW())
  ON CONFLICT (slug) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, "Seo".title),
    description = COALESCE(EXCLUDED.description, "Seo".description),
    status = 'PUBLISHED',
    "updatedAt" = NOW()
  RETURNING id INTO seo_id;

  UPDATE "Page" SET "seoId" = seo_id WHERE id = page_id;

  SELECT row_to_json(h)::jsonb INTO hero_json FROM "SubscriptionHeroSection" h ORDER BY h."sortOrder" ASC LIMIT 1;
  hero_json := COALESCE(hero_json, '{}'::jsonb);

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t."sortOrder") FILTER (WHERE t.visible), '[]'::jsonb) INTO trust_json FROM "SubscriptionTrustItem" t;
  SELECT row_to_json(p)::jsonb INTO pricing_json FROM "SubscriptionPricingSection" p ORDER BY p."sortOrder" ASC LIMIT 1;
  pricing_json := COALESCE(pricing_json, '{}'::jsonb);
  SELECT row_to_json(c)::jsonb INTO comparison_json FROM "SubscriptionComparisonSection" c ORDER BY c."sortOrder" ASC LIMIT 1;
  comparison_json := COALESCE(comparison_json, '{}'::jsonb);
  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r."sortOrder") FILTER (WHERE r.active), '[]'::jsonb) INTO comparison_rows_json FROM "SubscriptionComparisonRow" r;
  SELECT row_to_json(f)::jsonb INTO faq_json FROM "SubscriptionFaqSection" f ORDER BY f."sortOrder" ASC LIMIT 1;
  faq_json := COALESCE(faq_json, '{}'::jsonb);
  SELECT COALESCE(jsonb_agg(row_to_json(i) ORDER BY i."sortOrder") FILTER (WHERE i.active), '[]'::jsonb) INTO faqs_json FROM "SubscriptionFaqItem" i;
  SELECT row_to_json(t)::jsonb INTO testimonials_json FROM "SubscriptionTestimonialSection" t ORDER BY t."sortOrder" ASC LIMIT 1;
  testimonials_json := COALESCE(testimonials_json, '{}'::jsonb);
  SELECT COALESCE(jsonb_agg(row_to_json(i) ORDER BY i."sortOrder") FILTER (WHERE i.active), '[]'::jsonb) INTO testimonial_items_json FROM "SubscriptionTestimonialItem" i;
  SELECT row_to_json(c)::jsonb INTO cta_json FROM "SubscriptionCtaSection" c ORDER BY c."sortOrder" ASC LIMIT 1;
  cta_json := COALESCE(cta_json, '{}'::jsonb);

  props_json := jsonb_build_object(
    'page', jsonb_build_object('title', COALESCE(old_page.title, 'Subscription'), 'slug', 'subscription', 'metaTitle', COALESCE(old_page."metaTitle", old_page.title, 'Subscription'), 'metaDescription', old_page."metaDescription", 'ogImage', old_page."ogImage", 'active', COALESCE(old_page.active, true), 'sectionOrder', COALESCE(old_page."sectionOrder", '["hero","trust","pricing","comparison","faq","testimonials","cta"]'::jsonb)),
    'hero', hero_json,
    'trustItems', COALESCE(trust_json, '[]'::jsonb),
    'pricing', pricing_json,
    'comparison', comparison_json,
    'comparisonRows', COALESCE(comparison_rows_json, '[]'::jsonb),
    'faq', faq_json,
    'faqs', COALESCE(faqs_json, '[]'::jsonb),
    'testimonials', testimonials_json,
    'testimonialItems', COALESCE(testimonial_items_json, '[]'::jsonb),
    'cta', cta_json
  );

  UPDATE "PageBlock" SET "deletedAt" = NOW(), version = version + 1
  WHERE "pageId" = page_id AND type = 'CUSTOM_SECTION' AND "deletedAt" IS NULL;

  INSERT INTO "PageBlock" (id, "pageId", type, "order", props, "createdAt", "updatedAt", version)
  VALUES (COALESCE(old_page.id || '-subscription-cms-block', 'subscription-cms-block'), page_id, 'CUSTOM_SECTION', 0, props_json, NOW(), NOW(), 1);
END $$;

DROP TABLE IF EXISTS "SubscriptionPage" CASCADE;
DROP TABLE IF EXISTS "SubscriptionComparisonFeature" CASCADE;
DROP TABLE IF EXISTS "SubscriptionFaq" CASCADE;
DROP TABLE IF EXISTS "SubscriptionTestimonial" CASCADE;
DROP TABLE IF EXISTS "SubscriptionSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionHeroSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionTrustItem" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPricingSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionComparisonSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionComparisonRow" CASCADE;
DROP TABLE IF EXISTS "SubscriptionFaqSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionFaqItem" CASCADE;
DROP TABLE IF EXISTS "SubscriptionTestimonialSection" CASCADE;
DROP TABLE IF EXISTS "SubscriptionTestimonialItem" CASCADE;
DROP TABLE IF EXISTS "SubscriptionCtaSection" CASCADE;
