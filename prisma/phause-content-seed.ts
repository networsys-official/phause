import { PrismaClient, Prisma, PageBlockType, ContentStatus, AuditAction } from "@prisma/client";
import contentPack from "./data/phause-content.json";

export const PHAUSE_CONTENT_MARKER = "contentPack:phause-v2";

type Pack = typeof contentPack;
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function cleanProps(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function blockType(value: string): PageBlockType {
  const compact = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const map: Record<string, PageBlockType> = {
    hero: "HERO", cta: "CTA", ctabutton: "CTA_BUTTON", features: "FEATURES", services: "SERVICES",
    testimonials: "TESTIMONIALS", gallery: "GALLERY", faq: "FAQ", stats: "STATS", pricing: "PRICING",
    team: "TEAM", richtext: "RICHTEXT", video: "VIDEO", contact: "CONTACT", form: "FORM",
    customsection: "CUSTOM_SECTION", serviceshero: "SERVICES_HERO", servicesfeatures: "SERVICES_FEATURES",
    servicesprocess: "SERVICES_PROCESS", servicesaudiences: "SERVICES_AUDIENCES", servicesbenefits: "SERVICES_BENEFITS",
    servicesstats: "SERVICES_STATS", servicesfaq: "SERVICES_FAQ", servicescta: "SERVICES_CTA",
    homephilosophy: "HOME_PHILOSOPHY", homereasons: "HOME_REASONS", homeservices: "HOME_SERVICES",
    homeoffers: "HOME_OFFERS", homeprocess: "HOME_PROCESS", homecta: "HOME_CTA",
    aboutcapabilities: "ABOUT_CAPABILITIES", aboutvalues: "ABOUT_VALUES", aboutcommitments: "ABOUT_COMMITMENTS",
    abouttimeline: "ABOUT_TIMELINE", subscriptionfeatures: "SUBSCRIPTION_FEATURES",
    subscriptionfaq: "SUBSCRIPTION_FAQ", subscriptioncta: "SUBSCRIPTION_CTA",
  };
  return map[compact] ?? "CUSTOM_SECTION";
}

function publicPageStatus(slug: string, packStatus: unknown): ContentStatus {
  if (slug === "docs" || slug === "blog") return "PUBLISHED";
  if (slug === "resources") return "DRAFT";
  if (slug === "security-policy") return "PUBLISHED";
  if (packStatus === "PUBLISHED") return "PUBLISHED";
  return "DRAFT";
}

async function audit(tx: Tx, entityType: string, entityId: string, action: AuditAction, metadata: unknown, relation: Record<string, string>) {
  await tx.auditLog.create({ data: { entityType, entityId, action, metadata: cleanProps(metadata), ...relation } });
}

async function seedPages(tx: Tx, pack: Pack, migrate: boolean) {
  for (const [slug, pageDataUnknown] of Object.entries(pack.pages)) {
    const pageData = pageDataUnknown as Record<string, any>;
    if (slug === "privacy-policy" || slug === "cookie-policy" || slug === "terms-of-service" || slug === "responsible-disclosure") continue;

    const existing = await tx.page.findUnique({ where: { slug }, include: { blocks: { where: { deletedAt: null } } } });
    const title = slug === "subscription" ? "Subscription" : slug === "security-policy" ? "Security & Trust" : pageData.slug === "faq" ? "FAQ" : String(pageData.slug).split("-").map((part: string) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
    const desiredStatus = publicPageStatus(slug, pageData.status);

    const page = existing
      ? (migrate ? await tx.page.update({ where: { id: existing.id }, data: { title, status: desiredStatus, publishedAt: desiredStatus === "PUBLISHED" ? new Date() : existing.publishedAt, version: { increment: 1 } } }) : existing)
      : await tx.page.create({ data: { slug, title, status: desiredStatus, publishedAt: desiredStatus === "PUBLISHED" ? new Date() : null, version: 1 } });

    if (Array.isArray(pageData.blocks)) {
      if (migrate) {
        await tx.pageBlock.updateMany({ where: { pageId: page.id, deletedAt: null }, data: { deletedAt: new Date() } });
      }

      for (const [index, block] of pageData.blocks.entries()) {
        let props = { ...block };
        delete (props as Record<string, unknown>).type;

        if (slug === "home" && block.variant === "challenge") props = { ...props, position: 1 };
        if (slug === "home" && block.type === "faq") props = { ...props, title: block.title, items: block.items };
        if (slug === "contact" && block.type === "form") {
          const cf = pack.forms.contact as Record<string, any>;
          props = { formSlug: block.formSlug, title: cf.title, intro: cf.intro, messagePlaceholder: cf.messagePlaceholder, submitButton: cf.submitButton, privacyNote: cf.privacyNote, successMessage: cf.successMessage, errorMessage: cf.errorMessage };
        }
        if (slug === "home" && block.type === "hero") {
          props = { ...props, eyebrow: block.eyebrow, title: block.title, description: block.description, ctaPrimary: block.buttonText, ctaPrimaryHref: block.buttonLink, ctaSecondary: block.secondaryButtonText, ctaSecondaryHref: block.secondaryButtonLink, imageAlt: block.imageAlt };
        }

        const type = blockType(block.type);
        if (migrate) {
          await tx.pageBlock.create({ data: { pageId: page.id, type, order: index, props: cleanProps(props), version: 1 } });
        } else {
          const existingBlock = await tx.pageBlock.findFirst({ where: { pageId: page.id, type, deletedAt: null } });
          if (!existingBlock) await tx.pageBlock.create({ data: { pageId: page.id, type, order: index, props: cleanProps(props), version: 1 } });
        }
      }
    }

    await audit(tx, "Page", page.id, "UPDATE", { pack: PHAUSE_CONTENT_MARKER, slug, migrate, previous: existing ? { status: existing.status, title: existing.title } : null }, { pageId: page.id });
  }
}

async function seedSeo(tx: Tx, pack: Pack, migrate: boolean) {
  for (const entryUnknown of pack.seo as Array<Record<string, any>>) {
    const slug = String(entryUnknown.slug);
    const route = String(entryUnknown.route);
    const canonical = route === "/" ? "https://phause.com/" : `https://phause.com${route}`;
    const seo = await tx.seo.upsert({
      where: { slug },
      update: migrate ? { title: entryUnknown.title ?? undefined, description: entryUnknown.description ?? undefined, canonical, status: "PUBLISHED", deletedAt: null } : {},
      create: { slug, title: entryUnknown.title ?? null, description: entryUnknown.description ?? null, canonical, status: "PUBLISHED", publishedAt: new Date() },
    });

    const page = await tx.page.findUnique({ where: { slug } });
    if (page && (migrate || !page.seoId)) await tx.page.update({ where: { id: page.id }, data: { seoId: seo.id } });
    await audit(tx, "Seo", seo.id, "UPDATE", { slug, route, title: entryUnknown.title, description: entryUnknown.description }, { seoId: seo.id });
  }
}

async function seedFaqs(tx: Tx, pack: Pack, migrate: boolean) {
  const faqs = pack.faqs as Array<{ slug: string; question: string; answer: string; category: string; order: number }>;
  for (const faq of faqs) {
    const existing = await tx.faq.findUnique({ where: { slug: faq.slug } });
    const saved = await tx.faq.upsert({
      where: { slug: faq.slug },
      update: migrate ? { question: faq.question, answer: faq.answer, status: "PUBLISHED", deletedAt: null, publishedAt: new Date(), version: { increment: 1 } } : {},
      create: { slug: faq.slug, question: faq.question, answer: faq.answer, status: "PUBLISHED", publishedAt: new Date(), version: 1 },
    });
    await audit(tx, "Faq", saved.id, existing ? "UPDATE" : "CREATE", { old: existing ? { question: existing.question, answer: existing.answer, status: existing.status } : null, category: faq.category, order: faq.order }, { faqId: saved.id });
  }
}

async function seedPosts(tx: Tx, pack: Pack, migrate: boolean) {
  const posts = pack.posts as Array<Record<string, any>>;
  for (const post of posts) {
    const categoryName = post.slug === "turn-phishing-campaign-results-into-learning" ? "Reporting and Improvement" : String(post.category ?? "CMS");
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$|/g, "");
    const category = await tx.category.upsert({
      where: { slug: categorySlug },
      update: migrate ? { name: categoryName, status: "PUBLISHED", deletedAt: null } : {},
      create: { slug: categorySlug, name: categoryName, status: "PUBLISHED", publishedAt: new Date(), version: 1 },
    });

    const slug = String(post.slug);
    const seo = await tx.seo.upsert({
      where: { slug: `${slug}-seo` },
      update: migrate ? { title: post.seoTitle ?? post.title, description: post.metaDescription ?? post.excerpt, canonical: `https://phause.com/blog/${slug}`, status: "PUBLISHED", deletedAt: null } : {},
      create: { slug: `${slug}-seo`, title: post.seoTitle ?? post.title, description: post.metaDescription ?? post.excerpt, canonical: `https://phause.com/blog/${slug}`, status: "PUBLISHED", publishedAt: new Date() },
    });

    const existing = await tx.post.findUnique({ where: { slug }, include: { categories: true } });
    const cleanedHtml = typeof post.contentHtml === "string" ? post.contentHtml.replace(/<p>PHAUSE\s*\|\s*WEBSITE CONTENT LIBRARY\s*\|<\/p>/gi, "").replace(/PHAUSE\s*\|\s*WEBSITE CONTENT LIBRARY\s*\|/gi, "") : post.contentHtml;
    const saved = await tx.post.upsert({
      where: { slug },
      update: migrate ? { title: post.title, excerpt: post.metaDescription ?? post.excerpt, body: cleanedHtml, imageAlt: post.featuredImageAlt ?? null, status: "PUBLISHED", deletedAt: null, publishedAt: new Date(), seoId: seo.id, featuredImageId: null, thumbnailImageId: null, ogImageId: null, version: { increment: 1 }, categories: { set: [{ id: category.id }] } } : {},
      create: { slug, title: post.title, excerpt: post.metaDescription ?? post.excerpt, body: cleanedHtml, imageAlt: post.featuredImageAlt ?? null, status: "PUBLISHED", publishedAt: new Date(), seoId: seo.id, version: 1, categories: { connect: [{ id: category.id }] } },
    });
    await audit(tx, "Post", saved.id, existing ? "UPDATE" : "CREATE", { old: existing ? { title: existing.title, excerpt: existing.excerpt, body: existing.body } : null, category: categoryName, readingTime: post.readingTime, seoTitle: post.seoTitle }, { postId: saved.id });
  }
}

async function seedForm(tx: Tx, pack: Pack, migrate: boolean) {
  const formData = pack.forms.contact as Record<string, any>;
  const existing = await tx.form.findUnique({ where: { slug: formData.slug } });
  const oldFields = Array.isArray(existing?.fields) ? existing.fields as Array<Record<string, any>> : [];
  const oldByKey = new Map(oldFields.map((field) => [String(field.key), field]));

  const fields = formData.fields.map((field: Record<string, any>) => {
    const suggested = String(field.suggestedKey ?? "");
    const key = oldByKey.has(suggested) ? suggested : suggested === "category" && oldByKey.has("subject") ? "subject" : suggested;
    const placeholder = suggested === "message" ? formData.messagePlaceholder : suggested === "category" ? "General question" : "";
    return { key, label: field.label, type: field.type === "tel" ? "tel" : field.type, placeholder, required: field.required === true, ...(Array.isArray(field.options) ? { options: field.options } : {}) };
  });

  const saved = await tx.form.upsert({
    where: { slug: formData.slug },
    update: migrate ? { name: formData.title, fields: cleanProps(fields), status: "PUBLISHED", deletedAt: null, publishedAt: new Date(), version: { increment: 1 } } : {},
    create: { slug: formData.slug, name: formData.title, fields: cleanProps(fields), status: "PUBLISHED", publishedAt: new Date(), version: 1 },
  });
  await audit(tx, "Form", saved.id, existing ? "UPDATE" : "CREATE", { old: existing ? { name: existing.name, fields: existing.fields, status: existing.status } : null, successMessage: formData.successMessage, errorMessage: formData.errorMessage, privacyNote: formData.privacyNote }, { formId: saved.id });
}

async function seedFooter(tx: Tx, pack: Pack, migrate: boolean) {
  const footer = await tx.footer.findUnique({ where: { slug: "main-footer" } });
  if (!footer) {
    await tx.footer.create({ data: { slug: "main-footer", title: "Phause", description: pack.global.footerDescription, copyright: "Strengthen. Aware. Defend.", status: "PUBLISHED", version: 1 } });
  } else if (migrate) {
    await tx.footer.update({ where: { id: footer.id }, data: { description: pack.global.footerDescription, status: "PUBLISHED", deletedAt: null } });
  }
}

async function seedNavigation(tx: Tx, migrate: boolean) {
  const proposed = [
    { label: "Home", href: "/", position: 0 },
    { label: "Platform", href: "/services", position: 1 },
    { label: "How It Works", href: "/how-it-works", position: 2 },
    { label: "Solutions", href: "/solutions", position: 3 },
    { label: "About Us", href: "/about", position: 4 },
    { label: "Resources", href: "/blog", position: 5 },
    { label: "Docs", href: "/docs", position: 6 },
    { label: "Pricing", href: "/subscription", position: 7 },
    { label: "Contact Us", href: "/contact", position: 8 },
  ];

  const navigation = await tx.navigation.upsert({
    where: { key: "main" },
    update: migrate ? { label: "Main navigation", status: "PUBLISHED", deletedAt: null } : {},
    create: { key: "main", slug: "main-navigation", label: "Main navigation", href: "/", position: 0, status: "PUBLISHED", publishedAt: new Date(), version: 1 },
  });

  if (migrate) {
    await tx.navigationItem.updateMany({ where: { navigationId: navigation.id, deletedAt: null }, data: { deletedAt: new Date() } });
  }
  for (const item of proposed) {
    const existingItem = migrate ? null : await tx.navigationItem.findFirst({ where: { navigationId: navigation.id, href: item.href, deletedAt: null } });
    if (!existingItem) await tx.navigationItem.create({ data: { navigationId: navigation.id, label: item.label, href: item.href, position: item.position, status: "PUBLISHED", version: 1 } });
  }
  await audit(tx, "Navigation", navigation.id, "UPDATE", { proposed }, { navigationId: navigation.id });
}

async function seedDocs(tx: Tx, pack: Pack, migrate: boolean) {
  const docs = pack.docs as Record<string, any>;
  const existing = await tx.page.findUnique({ where: { slug: "docs" }, include: { blocks: { where: { deletedAt: null } } } });
  const page = existing ?? await tx.page.create({ data: { slug: "docs", title: "Docs", status: "PUBLISHED", publishedAt: new Date(), version: 1 } });

  if (migrate) {
    await tx.pageBlock.updateMany({ where: { pageId: page.id, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  if (migrate || !(await tx.pageBlock.findFirst({ where: { pageId: page.id, type: "HERO", deletedAt: null } }))) {
    await tx.pageBlock.create({ data: { pageId: page.id, type: "HERO", order: 0, props: cleanProps(docs.hero), version: 1 } });
  }

  if (migrate || !(await tx.pageBlock.findFirst({ where: { pageId: page.id, type: "CUSTOM_SECTION", deletedAt: null } }))) {
    await tx.pageBlock.create({ data: { pageId: page.id, type: "CUSTOM_SECTION", order: 1, props: cleanProps({ title: "Documentation", closingNote: docs.closingNote, items: docs.navigation.map((group: Record<string, any>) => ({ category: group.category, articles: group.articles })) }), version: 1 } });
  }

  if (migrate || !(await tx.pageBlock.findFirst({ where: { pageId: page.id, type: "RICHTEXT", deletedAt: null } }))) {
    await tx.pageBlock.create({ data: { pageId: page.id, type: "RICHTEXT", order: 2, props: cleanProps({ title: docs.quickStart.title, slug: docs.quickStart.slug, status: docs.quickStart.status, category: docs.quickStart.category, sections: docs.quickStart.sections }), version: 1 } });
  }
  await audit(tx, "Page", page.id, "UPDATE", { old: existing ? { status: existing.status, blockCount: existing.blocks.length } : null, docs: true }, { pageId: page.id });
}

async function seedSupportAndLocation(tx: Tx, migrate: boolean) {
  await tx.setting.upsert({
    where: { key: "supportPhone" },
    update: migrate ? { value: "", status: "PUBLISHED", deletedAt: null } : {},
    create: { slug: "supportPhone", key: "supportPhone", value: "", status: "PUBLISHED", publishedAt: new Date(), version: 1 },
  });
}

export async function applyPhauseContentPack(prisma: PrismaClient, options: { dryRun?: boolean; force?: boolean } = {}) {
  const dryRun = options.dryRun ?? process.env.PHAUSE_CONTENT_DRY_RUN === "1";
  const force = options.force ?? process.env.PHAUSE_CONTENT_FORCE === "1";

  if (dryRun) {
    console.log(JSON.stringify({ marker: PHAUSE_CONTENT_MARKER, force, wouldSeed: true, pages: Object.keys(contentPack.pages).length, faqs: contentPack.faqs.length, posts: contentPack.posts.length }, null, 2));
    return { applied: false, dryRun: true };
  }

  const marker = await prisma.setting.findUnique({ where: { key: PHAUSE_CONTENT_MARKER } });
  const migrate = !marker;

  await prisma.$transaction(async (tx) => {
    await seedPages(tx as unknown as Tx, contentPack, migrate);
    await seedDocs(tx as unknown as Tx, contentPack, migrate);
    await seedSeo(tx as unknown as Tx, contentPack, migrate);
    await seedFaqs(tx as unknown as Tx, contentPack, migrate);
    await seedPosts(tx as unknown as Tx, contentPack, migrate);
    await seedForm(tx as unknown as Tx, contentPack, migrate);
    await seedFooter(tx as unknown as Tx, contentPack, migrate);
    await seedNavigation(tx as unknown as Tx, migrate);
    await seedSupportAndLocation(tx as unknown as Tx, migrate);

    await tx.setting.upsert({
      where: { key: PHAUSE_CONTENT_MARKER },
      update: {},
      create: { slug: PHAUSE_CONTENT_MARKER, key: PHAUSE_CONTENT_MARKER, value: "1", status: "PUBLISHED", publishedAt: new Date(), version: 1 },
    });
  });

  return { applied: true, force, dryRun: false };
}

export default applyPhauseContentPack;
