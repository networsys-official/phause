import type { Metadata } from "next";

export type SeoMetadataInput = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  baseUrl?: string;
};

export function buildMetadata(input: SeoMetadataInput): Metadata {
  const title = input.title ?? "Phause | Strengthen. Aware. Defend.";
  const description = input.description ?? "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.";
  const canonical = input.canonical ?? input.baseUrl ?? "https://phause.com";
  const ogImage = input.ogImage ?? "/logo.png";

  return {
    title,
    description,
    keywords: input.keywords ?? ["phishing simulation", "security awareness", "cybersecurity"],
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: input.ogTitle ?? title,
      description: input.ogDescription ?? description,
      url: canonical,
      siteName: "Phause",
      images: [{ url: ogImage, alt: title }],
      type: "website",
    },
    twitter: {
      card: (input.twitterCard === "summary" || input.twitterCard === "summary_large_image" || input.twitterCard === "app" || input.twitterCard === "player"
        ? input.twitterCard
        : "summary_large_image") as "summary" | "summary_large_image" | "player" | "app",
      title: input.ogTitle ?? title,
      description: input.ogDescription ?? description,
      images: [ogImage],
    },
  };
}
