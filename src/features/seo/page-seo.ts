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
    title: input.title ?? "Phause | Phishing Simulation & Security Awareness",
    description:
      input.description ??
      "Run phishing simulations, understand employee engagement and build a stronger security-awareness programme with Phause.",
    keywords: input.keywords ?? ["phishing simulation", "security awareness", "employee engagement", "phause"],
    canonical,
    robots: "index,follow",
    og: {
      title: input.title ?? "Phause | Phishing Simulation & Security Awareness",
      description:
        input.description ??
        "Run phishing simulations, understand employee engagement and build a stronger security-awareness programme with Phause.",
      image: `${baseUrl}/logo.png`,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title ?? "Phause | Phishing Simulation & Security Awareness",
      description:
        input.description ??
        "Run phishing simulations, understand employee engagement and build a stronger security-awareness programme with Phause.",
      image: `${baseUrl}/logo.png`,
    },
  };
}
