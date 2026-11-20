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
      "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
    keywords: input.keywords ?? ["cybersecurity", "threat detection", "cloud protection", "phause"],
    canonical,
    robots: "index,follow",
    og: {
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
      image: `${baseUrl}/logo.png`,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
    },
  };
}
