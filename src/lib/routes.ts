
/**
 * Centralized route configuration for Phause.
 * Update URLs here and they propagate everywhere (Navbar, Footer, Sitemap, etc.).
 */

export const ROUTES = {
  home: "/",
  about: "/about",
  howItWorks: "/how-it-works",
  services: "/services",
  blog: "/blog",
  docs: "/docs",
  subscription: "/subscription",
  subscriptionCheckout: "/subscription/checkout",
  registration: "/registration",
  contact: "/contact",
  faq: "/faq",
} as const;

/** Navigation links shown in the Navbar */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: ROUTES.home },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "Features", href: ROUTES.services },
  { label: "About Us", href: ROUTES.about },
  { label: "Contact Us", href: ROUTES.contact },
];

export const FOOTER_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: ROUTES.home },
  { label: "About Us", href: ROUTES.about },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "Features", href: ROUTES.services },
  { label: "Blog", href: ROUTES.blog },
  { label: "Docs", href: ROUTES.docs },
  { label: "Subscription", href: ROUTES.subscription },
  { label: "FAQ", href: ROUTES.faq },
  { label: "Contact Us", href: ROUTES.contact },
];

export const FOOTER_SERVICE_LINKS: { label: string; href: string }[] = [
  { label: "Threat Detection", href: "/services#threat-detection" },
  { label: "Security Audits", href: "/services#security-audits" },
  { label: "Cloud Protection", href: "/services#cloud-protection" },
  { label: "Data Encryption", href: "/services#data-encryption" },
];

export const FOOTER_LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

/** Backwards-compatible alias for existing footer consumers. */
export const FOOTER_LINKS: { label: string; href: string }[] = FOOTER_QUICK_LINKS;

/** Legacy alias for service links kept deliberately distinct from a header shortcut. */
export const FOOTER_SERVICES: { label: string; href: string }[] = FOOTER_SERVICE_LINKS;

function getDuplicateLabels(items: { label: string; href: string }[]) {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const key = `${item.label.toLowerCase().trim()}::${item.href.toLowerCase().trim()}`;
    if (seen.has(key)) {
      duplicates.add(key);
      continue;
    }
    seen.set(key, item.label);
  }

  return [...duplicates].map((key) => key.split("::")[0]);
}

const VALID_ROUTE_PATHS = new Set([
  "/",
  "/about",
  "/how-it-works",
  "/services",
  "/blog",
  "/docs",
  "/subscription",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
]);

const KNOWN_FRAGMENT_TARGETS: Record<string, Set<string>> = {
  "/services": new Set([
    "threat-detection",
    "security-audits",
    "cloud-protection",
    "data-encryption",
  ]),
};

function isKnownFooterTarget(href: string) {
  if (href === "#") return false;

  const [pathPart, hashPart] = href.split("#");
  const normalizedPath = pathPart || "/";

  if (!VALID_ROUTE_PATHS.has(normalizedPath)) {
    return false;
  }

  if (!hashPart) {
    return true;
  }

  const allowedTargets = KNOWN_FRAGMENT_TARGETS[normalizedPath] ?? new Set();
  return allowedTargets.has(hashPart.toLowerCase());
}

export function validateFooterNavigation() {
  const footerCatalog = [...FOOTER_QUICK_LINKS, ...FOOTER_SERVICE_LINKS, ...FOOTER_LEGAL_LINKS];
  const duplicates = getDuplicateLabels(footerCatalog);
  const invalidLinks = footerCatalog.filter((item) => item.href === "#" || !isKnownFooterTarget(item.href));

  if (duplicates.length > 0) {
    console.warn("[footer-navigation] Duplicate footer links detected:", duplicates);
  }

  if (invalidLinks.length > 0) {
    console.warn("[footer-navigation] Footer contains dead, placeholder, or invalid destinations:", invalidLinks);
  }

  const duplicateHeaderLinks = FOOTER_QUICK_LINKS.filter((link) =>
    NAV_LINKS.some((headerLink) => headerLink.label.toLowerCase() === link.label.toLowerCase() && headerLink.href === link.href),
  );

  if (duplicateHeaderLinks.length > 0) {
    console.warn("[footer-navigation] Footer quick links duplicate header navigation without justification:", duplicateHeaderLinks);
  }
}

validateFooterNavigation();
