import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { defaultFooterSeed, defaultNavigationSeed, homeHeroSeed, liveSiteDefaults } from "../src/features/cms/seed-defaults";
import { applyPhauseContentPack } from "./phause-content-seed";
import { applyContentPatches } from "../src/features/cms/content-patches";

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
		excerpt:
			"Discover why protecting your digital infrastructure is essential for business continuity, customer trust and long-term growth.",
		body:
			"Technology has become central to how modern businesses operate. From customer information to internal systems, organisations depend on digital infrastructure every day.\n\nCybersecurity helps protect these systems from unauthorised access, data loss and disruption. A thoughtful security strategy is not just an IT requirement; it is an important part of business continuity.\n\nBusinesses should take a proactive approach by reviewing access permissions, keeping software updated, educating employees and monitoring their systems.\n\nThe right cybersecurity practices help organisations reduce risk, protect customer trust and operate with greater confidence.",
		image:
			"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85",
		imageAlt: "Why Cybersecurity Matters for Modern Businesses",
	},
	{
		slug: "building-a-smarter-it-infrastructure",
		title: "Building a Smarter IT Infrastructure",
		excerpt:
			"Learn how a reliable and scalable IT foundation can help your organisation work more efficiently.",
		body:
			"A dependable IT infrastructure supports the everyday activities of a modern organisation.\n\nA well-planned environment brings together networks, devices, software and support processes so teams can work effectively.\n\nRegular maintenance, clear documentation and scalable systems help businesses prepare for changing operational needs.",
		image:
			"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
		imageAlt: "Building a Smarter IT Infrastructure",
	},
	{
		slug: "the-value-of-managed-it-services",
		title: "The Value of Managed IT Services",
		excerpt:
			"Explore how ongoing IT support and maintenance can reduce complexity and keep business operations running.",
		body:
			"Managing technology internally can require significant time, resources and specialist knowledge.\n\nManaged IT services provide ongoing support for systems, infrastructure and day-to-day technical requirements.\n\nWith a consistent support approach, businesses can focus more attention on their core activities while keeping their technology maintained.",
		image:
			"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
		imageAlt: "The Value of Managed IT Services",
	},
] as const;

const prisma = new PrismaClient();

const DEFAULT_PAGE_SLUGS = [
	"home",
	"about",
	"services",
	"faq",
	"docs",
	"blog",
	"contact",
	"subscription",
] as const;

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SEED_ADMIN_FORCE_PASSWORD = process.env.SEED_ADMIN_FORCE_PASSWORD === "1";

async function ensureBootstrapAdmin() {
	if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
		console.log("Seed admin skipped: SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing.");
		return;
	}

	const existing = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
	const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

	await prisma.user.upsert({
		where: { email: SEED_ADMIN_EMAIL },
		update: existing && SEED_ADMIN_FORCE_PASSWORD
			? { passwordHash }
			: {},
		create: {
			name: "Phause Admin",
			email: SEED_ADMIN_EMAIL,
			emailVerified: new Date(),
			passwordHash: passwordHash as string,
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
			update: {},
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
			update: {},
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

async function ensureCmsDefaults() {
	for (const slug of DEFAULT_PAGE_SLUGS) {
		const page = await prisma.page.findUnique({ where: { slug } });
		if (!page) continue;

		const seo = await prisma.seo.findUnique({ where: { slug: `${slug}-seo` } });
		if (!seo) {
			const createdSeo = await prisma.seo.create({
				data: {
					slug: `${slug}-seo`,
					title: slug === "home" ? liveSiteDefaults.title : page.title,
					description: slug === "home" ? liveSiteDefaults.description : `${page.title} page`,
					canonical: slug === "home" ? liveSiteDefaults.canonical : `https://phause.com/${slug}`,
					keywords: "phause",
					ogTitle: slug === "home" ? liveSiteDefaults.ogTitle : null,
					ogDescription: slug === "home" ? liveSiteDefaults.ogDescription : null,
					status: "PUBLISHED",
				},
			});
			await prisma.page.update({ where: { id: page.id }, data: { seoId: createdSeo.id } });
		}
	}

	const home = await prisma.page.findUnique({ where: { slug: "home" } });
	if (home) {
		const hero = await prisma.pageBlock.findFirst({ where: { pageId: home.id, type: "HERO", deletedAt: null } });
		if (!hero) {
			await prisma.pageBlock.create({
				data: { pageId: home.id, type: "HERO", order: 0, props: homeHeroSeed as object },
			});
		}
	}

	const navigation = await prisma.navigation.findUnique({ where: { key: defaultNavigationSeed.key } }).catch(() => null);
	if (!navigation) {
		const created = await prisma.navigation.create({
			data: { key: defaultNavigationSeed.key, slug: "main-navigation", label: defaultNavigationSeed.label, href: "/", position: 0, status: "PUBLISHED", version: 1 },
		});
		await prisma.navigationItem.createMany({
			data: defaultNavigationSeed.items.map((item) => ({ navigationId: created.id, label: item.label, href: item.href, position: item.position, status: "PUBLISHED", version: 1 })),
		});
	}

	const footer = await prisma.footer.findUnique({ where: { slug: "main-footer" } }).catch(() => null);
	if (!footer) {
		const created = await prisma.footer.create({
			data: { slug: "main-footer", title: defaultFooterSeed.title, description: defaultFooterSeed.description, copyright: defaultFooterSeed.copyright, status: "PUBLISHED", version: 1 },
		});
		await prisma.footerLink.createMany({
			data: defaultFooterSeed.links.map((item) => ({ footerId: created.id, label: item.label, href: item.href, position: item.position, type: "LINK", status: "PUBLISHED", version: 1 })),
		});
	}

	const subscription = await prisma.page.findUnique({ where: { slug: "subscription" } });
	if (subscription) {
		const block = await prisma.pageBlock.findFirst({ where: { pageId: subscription.id, type: "CUSTOM_SECTION", deletedAt: null } });
		if (!block) {
			await prisma.pageBlock.create({
				data: {
					pageId: subscription.id,
					type: "CUSTOM_SECTION",
					order: 0,
					props: {
						page: { title: "Subscription", slug: "subscription", metaTitle: "Phause | Pricing & Plans", metaDescription: "Five tiers. One platform. Zero compromises.", ogImage: null, active: true, sectionOrder: ["hero", "trust", "pricing", "comparison", "faq", "testimonials", "cta"] },
						hero: { badgeText: "Pricing & Plans", badgeIcon: "sparkles", badgeVisible: true, heading: "Security that scales with you", highlightedWord: "scales", subtitle: "Five tiers. One platform. Zero compromises.", backgroundImage: null, ctaPrimaryText: "Choose a plan", ctaPrimaryUrl: "#pricing", ctaSecondaryText: "Talk to us", ctaSecondaryUrl: "/contact", accentColor: "cyan", overlayColor: "#05090f", visible: true, sortOrder: 0 },
						trustItems: [],
						pricing: { title: "Plans that scale with your security", subtitle: "Find the right level of protection.", badgeText: "Pricing", accentColor: "cyan", visible: true, sortOrder: 0 },
						comparison: { title: "Compare every dimension", subtitle: "Compare limits and features.", visible: true, sortOrder: 0 },
						comparisonRows: [],
						faq: { title: "Frequently asked questions", subtitle: "Answers about plans and billing.", visible: true, sortOrder: 0 },
						faqs: [],
						testimonials: { title: "Customer stories", subtitle: "Why teams choose Phause.", visible: false, sortOrder: 0 },
						testimonialItems: [],
						cta: { title: "Still unsure? Talk to a human.", description: "Our security engineers will map your environment to the right tier.", buttonText: "Book a free consultation", buttonUrl: "/contact", backgroundImage: null, visible: true, sortOrder: 0 },
					},
					version: 1,
				},
			});
		}
	}
}

async function main() {
	await ensurePages();
	await ensureFaqs();
	await ensureBlogPosts();
	await ensureBootstrapAdmin();
	await ensureCmsDefaults();
	await applyPhauseContentPack(prisma);
	await applyContentPatches();
}

main()
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
