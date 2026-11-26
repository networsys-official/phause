import { z } from "zod";

export const siteMetadataSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  canonical: z.string().min(1),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

export const liveSiteDefaults = siteMetadataSchema.parse({
  title: "Phause | Phishing Simulation & Security Awareness",
  description: "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with Phause campaign management, reporting and training tools.",
  canonical: "https://phause.com",
  ogTitle: "Phause | Phishing Simulation & Security Awareness",
  ogDescription: "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with Phause campaign management, reporting and training tools.",
});

export const homeHeroSeed = {
  eyebrow: "PHISHING SIMULATION & SECURITY AWARENESS",
  title: "Turn phishing awareness into measurable security readiness.",
  description: "Phishing is a people problem as much as a technology problem. Phause helps your organisation run authorised simulations, understand employee interactions and turn campaign findings into practical security-awareness action.",
  ctaPrimary: "Create an Account",
  ctaSecondary: "Explore the Platform",
  ctaPrimaryHref: "/registration",
  ctaSecondaryHref: "/services",
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
