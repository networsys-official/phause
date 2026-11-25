import { z } from "zod";

export const siteMetadataSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  canonical: z.string().min(1),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

export const liveSiteDefaults = siteMetadataSchema.parse({
  title: "Phause | Strengthen. Aware. Defend.",
  description: "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
  canonical: "https://phause.com",
  ogTitle: "Phause | Strengthen. Aware. Defend.",
  ogDescription: "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
});

export const homeHeroSeed = {
  eyebrow: "Strengthen. Aware. Defend.",
  title: "Strengthen. Aware. Defend.",
  description: liveSiteDefaults.description,
  ctaPrimary: "Get Protected Now",
  ctaSecondary: "Explore Platform",
  ctaPrimaryHref: "/subscription",
  ctaSecondaryHref: "/about",
};

export const defaultNavigationSeed = {
  key: "main",
  label: "Main navigation",
  items: [
    { label: "Home", href: "/", position: 0 },
    { label: "About Us", href: "/about", position: 1 },
    { label: "Services", href: "/services", position: 2 },
    { label: "Blog", href: "/blog", position: 3 },
    { label: "Docs", href: "/docs", position: 4 },
    { label: "Subscription", href: "/subscription", position: 5 },
    { label: "Contact Us", href: "/contact", position: 6 },
  ],
};

export const defaultFooterSeed = {
  title: "Phause",
  description: liveSiteDefaults.description,
  copyright: "Strengthen. Aware. Defend.",
  links: [
    { label: "Home", href: "/", position: 0 },
    { label: "About Us", href: "/about", position: 1 },
    { label: "Services", href: "/services", position: 2 },
    { label: "Blog", href: "/blog", position: 3 },
    { label: "Docs", href: "/docs", position: 4 },
    { label: "FAQ", href: "/faq", position: 5 },
    { label: "Subscription", href: "/subscription", position: 6 },
  ],
};
