export type PageSeoInput = {
  slug: string;
  title?: string;
  description?: string;
  keywords?: string[];
  baseUrl?: string;
};

export function buildSiteSeo(input: PageSeoInput) {
  const baseUrl = input.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://phause.com";
  const slug = input.slug.startsWith("/") ? input.slug : `/${input.slug}`;
  const canonical = `${baseUrl}${slug}`;

  return {
    slug,
    title: input.title ?? "Phause | Strengthen. Aware. Defend.",
    description:
      input.description ??
      "Enterprise-grade cybersecurity solutions for modern organizations with AI-driven monitoring and expert response.",
    keywords: input.keywords ?? ["cybersecurity", "security operations", "fraud prevention"],
    canonical,
    robots: "index,follow",
    og: {
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Enterprise-grade cybersecurity solutions for modern organizations with AI-driven monitoring and expert response.",
      image: `${baseUrl}/logo.png`,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Enterprise-grade cybersecurity solutions for modern organizations with AI-driven monitoring and expert response.",
      image: `${baseUrl}/logo.png`,
    },
  };
}
