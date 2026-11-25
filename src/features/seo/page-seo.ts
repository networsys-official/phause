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
      "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
    keywords: input.keywords ?? ["cybersecurity", "threat detection", "cloud protection", "phause"],
    canonical,
    robots: "index,follow",
    og: {
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
      image: `${baseUrl}/logo.png`,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title ?? "Phause | Strengthen. Aware. Defend.",
      description:
        input.description ??
        "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
    },
  };
}
