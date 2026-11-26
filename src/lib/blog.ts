import { prisma } from "@/infrastructure/database/prisma";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  thumbnailImage?: string;
  featuredImage?: string;
  ogImage?: string;
  imageAlt?: string;
  author: string;
  content: string[];
};

export const fallbackBlogPosts: BlogPost[] = [
  { slug: "why-phishing-simulations-matter", title: "Why Phishing Simulations Matter for Security Awareness", excerpt: "Learn how authorised simulations help teams understand employee behaviour and turn awareness into practical learning.", category: "Security Awareness", date: "November 18, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: [] },
  { slug: "responsible-phishing-simulation-planning", title: "How to Plan a Responsible Phishing Simulation", excerpt: "A practical checklist for defining scope, choosing an audience and communicating responsibly.", category: "Programme Planning", date: "November 18, 2026", readTime: "6 min read", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: [] },
  { slug: "understanding-phishing-simulation-tracking-metrics", title: "Understanding Phishing Simulation Opens and Clicks", excerpt: "Understand what common campaign tracking signals can and cannot show.", category: "Reporting", date: "November 18, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: [] },
  { slug: "turn-phishing-campaign-results-into-learning", title: "Turn Phishing Campaign Results into Better Learning", excerpt: "Use campaign findings to plan constructive follow-up learning.", category: "Reporting and Improvement", date: "November 18, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: [] },
];

export const blogPosts = fallbackBlogPosts;

export const blogCategories = [
  "All",
  ...Array.from(new Set(fallbackBlogPosts.map((post) => post.category))),
];

export async function getAllBlogPosts() {
  try {
    const rows = await prisma.post.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        status: true,
        createdAt: true,
        imageAlt: true,
        featuredImage: { select: { url: true, altText: true, id: true } },
        thumbnailImage: { select: { url: true, altText: true, id: true } },
        ogImage: { select: { url: true, altText: true, id: true } },
      },
    });

    return rows.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? "",
      category: "CMS",
      date: new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      readTime: "5 min read",
      image: post.featuredImage?.url ?? post.thumbnailImage?.url ?? "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
      thumbnailImage: post.thumbnailImage?.url ?? post.featuredImage?.url ?? undefined,
      featuredImage: post.featuredImage?.url ?? undefined,
      ogImage: post.ogImage?.url ?? undefined,
      imageAlt: post.imageAlt ?? post.featuredImage?.altText ?? post.title,
      author: "Phause Team",
      content: (post.body ?? "").split(/\n{2,}|\n/).filter(Boolean),
    }));
  } catch {
    return [];
  }
}

export async function getBlogPost(slug: string) {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug);
}
