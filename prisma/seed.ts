import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const defaultFaqs = [
  {
    slug: "faq-verify-1793703803798",
    question: "FAQ verify 1793703803798",
    answer: "FAQ answer body",
  },
  {
    slug: "faq-verify-1793703703617",
    question: "FAQ verify 1793703703617",
    answer: "FAQ answer body",
  },
  {
    slug: "faq-verify-1793703663305",
    question: "FAQ verify 1793703663305",
    answer: "FAQ answer body",
  },
  {
    slug: "faq-verify-1793703153566",
    question: "FAQ verify 1793703153566",
    answer: "FAQ answer body",
  },
  {
    slug: "faq-verify-1793703092724",
    question: "FAQ verify 1793703092724",
    answer: "FAQ answer body",
  },
  {
    slug: "faq-verify-1793703044570",
    question: "FAQ verify 1793703044570",
    answer: "FAQ answer body",
  },
] as const;

const defaultBlogPosts = [
  {
    slug: "why-cybersecurity-matters",
    title: "Why Cybersecurity Matters for Modern Businesses",
    excerpt: "Discover why protecting your digital infrastructure is essential for business continuity, customer trust and long-term growth.",
    body:
      "Technology has become central to how modern businesses operate. From customer information to internal systems, organisations depend on digital infrastructure every day.\n\nCybersecurity helps protect these systems from unauthorised access, data loss and disruption. A thoughtful security strategy is not just an IT requirement; it is an important part of business continuity.\n\nBusinesses should take a proactive approach by reviewing access permissions, keeping software updated, educating employees and monitoring their systems.\n\nThe right cybersecurity practices help organisations reduce risk, protect customer trust and operate with greater confidence.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Why Cybersecurity Matters for Modern Businesses",
  },
  {
    slug: "building-a-smarter-it-infrastructure",
    title: "Building a Smarter IT Infrastructure",
    excerpt: "Learn how a reliable and scalable IT foundation can help your organisation work more efficiently.",
    body:
      "A dependable IT infrastructure supports the everyday activities of a modern organisation.\n\nA well-planned environment brings together networks, devices, software and support processes so teams can work effectively.\n\nRegular maintenance, clear documentation and scalable systems help businesses prepare for changing operational needs.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Building a Smarter IT Infrastructure",
  },
  {
    slug: "the-value-of-managed-it-services",
    title: "The Value of Managed IT Services",
    excerpt: "Explore how ongoing IT support and maintenance can reduce complexity and keep business operations running.",
    body:
      "Managing technology internally can require significant time, resources and specialist knowledge.\n\nManaged IT services provide ongoing support for systems, infrastructure and day-to-day technical requirements.\n\nWith a consistent support approach, businesses can focus more attention on their core activities while keeping their technology maintained.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "The Value of Managed IT Services",
  },
] as const;

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "phause@gmail.com";
const DEFAULT_PAGE_SLUGS = [
  "home",
  "about",
  "services",
  "faq",
  "docs",
  "blog",
  "contact",
] as const;

async function ensureBootstrapAdmin() {
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!password) {
    console.warn("BOOTSTRAP_ADMIN_PASSWORD is not set; skipping admin bootstrap.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });

  if (existing) {
    if (existing.role !== Role.SUPER_ADMIN || existing.status !== UserStatus.ACTIVE) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Phause Admin",
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

async function ensurePages() {
  const pageLabels: Record<string, string> = {
    home: "Home",
    about: "About",
    services: "Services",
    faq: "FAQ",
    docs: "Docs",
    blog: "Blog",
    contact: "Contact",
  };

  for (const slug of DEFAULT_PAGE_SLUGS) {
    const existing = await prisma.page.findUnique({
      where: { slug },
    });

    if (existing) continue;

    await prisma.page.create({
      data: {
        slug,
        title: pageLabels[slug] ?? slug,
        status: "DRAFT",
        seo: {
          create: {
            slug: `${slug}-seo`,
            title: pageLabels[slug] ?? slug,
            description: `${pageLabels[slug] ?? slug} page`,
            canonical: `https://phause.com/${slug === "home" ? "" : slug}`,
            keywords: "phause",
            status: "DRAFT",
          },
        },
      },
    });
  }
}

async function ensureFaqs() {
  const count = await prisma.faq.count();
  if (count > 0) {
    return;
  }

  await prisma.faq.createMany({
    data: defaultFaqs.map((faq) => ({
      slug: faq.slug,
      question: faq.question,
      answer: faq.answer,
      status: "PUBLISHED",
    })),
  });
}

async function ensureBlogPosts() {
  const count = await prisma.post.count();
  if (count > 0) {
    return;
  }

  for (const post of defaultBlogPosts) {
    const media = await prisma.media.upsert({
      where: { slug: `${post.slug}-featured` },
      update: {
        title: post.title,
        filename: `${post.slug}.jpg`,
        mimeType: "image/jpeg",
        url: post.image,
        altText: post.imageAlt,
        size: 0,
        status: "PUBLISHED",
      },
      create: {
        slug: `${post.slug}-featured`,
        title: post.title,
        filename: `${post.slug}.jpg`,
        mimeType: "image/jpeg",
        url: post.image,
        altText: post.imageAlt,
        size: 0,
        status: "PUBLISHED",
      },
    });

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        imageAlt: post.imageAlt,
        status: "PUBLISHED",
        featuredImageId: media.id,
        thumbnailImageId: media.id,
        ogImageId: media.id,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        imageAlt: post.imageAlt,
        status: "PUBLISHED",
        featuredImageId: media.id,
        thumbnailImageId: media.id,
        ogImageId: media.id,
      },
    });
  }
}

async function main() {
  await ensurePages();
  await ensureFaqs();
  await ensureBlogPosts();
  await ensureBootstrapAdmin();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
