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
  { slug: "why-phishing-simulations-matter", title: "Why Phishing Simulations Matter for Security Awareness", excerpt: "Learn how authorised simulations help teams understand employee behaviour and turn awareness into practical learning.", category: "Phishing Awareness", date: "November 18, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: ["Phishing remains effective because a convincing message can make an unexpected request look routine.", "A phishing simulation gives an organisation a controlled way to understand how employees interact with example messages. One click should never be treated as a complete judgement of an employee’s security knowledge.", "A thoughtful programme starts with clear authorisation, a defined audience, appropriate consent and a learning objective. Follow the message with constructive guidance rather than blame.", "Use campaign results to identify themes, plan targeted awareness activities and repeat exercises responsibly over time."] },
  { slug: "designing-a-responsible-phishing-campaign", title: "How to Plan a Responsible Phishing Simulation", excerpt: "A practical checklist for defining scope, choosing an audience and communicating responsibly before a campaign.", category: "Security Operations", date: "November 18, 2026", readTime: "6 min read", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: ["Before launching a phishing simulation, agree the purpose of the exercise and obtain the approvals required by your organisation.", "Define which employees are eligible, confirm consent requirements, choose a suitable template and review the planned delivery window.", "Coordinate with help-desk and security teams. Avoid collecting real passwords or unnecessary personal information.", "After the campaign, share clear learning points and use aggregate trends to plan the next stage of your awareness programme."] },
  { slug: "turning-campaign-results-into-learning", title: "Turn Phishing Campaign Results into Better Learning", excerpt: "Use engagement patterns and reporting to plan useful follow-up training without blaming employees.", category: "Security Awareness", date: "November 18, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=85", author: "Phause Team", content: ["A campaign report is most useful when it leads to a practical next step. Look for patterns across teams, message types and time periods rather than focusing on one isolated action.", "Interpret opens and clicks carefully. Email privacy features, automated scanners and different devices can affect tracking signals.", "Choose follow-up activity that matches the learning need, such as a short training module, team discussion or guidance on checking sender identity and unexpected links.", "Repeat the cycle and compare results over time, while keeping individual results confidential and using them constructively."] }
];

export const blogPosts = fallbackBlogPosts;

export const blogCategories = [
  "All",
  ...Array.from(new Set(fallbackBlogPosts.map((post) => post.category))),
];

export async function getAllBlogPosts() {
  try {
    const rows = await prisma.post.findMany({
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
    return fallbackBlogPosts;
  }
}

export async function getBlogPost(slug: string) {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) ?? fallbackBlogPosts.find((post) => post.slug === slug);
}
