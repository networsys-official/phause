export type FooterCmsLink = {
  label: string;
  href: string;
  position?: number;
  type?: string | null;
  pageId?: string | null;
  status?: string | null;
};


export const FALLBACK_FOOTER_LINKS = [
  { label: "Home", href: "/", position: 0, type: "QUICK_LINKS" },
  { label: "About Us", href: "/about", position: 1, type: "QUICK_LINKS" },
  { label: "Services", href: "/services", position: 2, type: "QUICK_LINKS" },
  { label: "Blog", href: "/blog", position: 3, type: "QUICK_LINKS" },
  { label: "Docs", href: "/docs", position: 4, type: "QUICK_LINKS" },
  { label: "Subscription", href: "/subscription", position: 5, type: "QUICK_LINKS" },
  { label: "FAQ", href: "/faq", position: 6, type: "QUICK_LINKS" },
  { label: "Contact Us", href: "/contact", position: 7, type: "QUICK_LINKS" },
  { label: "Threat Detection", href: "/services#threat-detection", position: 8, type: "SERVICES" },
  { label: "Security Audits", href: "/services#security-audits", position: 9, type: "SERVICES" },
  { label: "Cloud Protection", href: "/services#cloud-protection", position: 10, type: "SERVICES" },
  { label: "Data Encryption", href: "/services#data-encryption", position: 11, type: "SERVICES" },
  { label: "Privacy Policy", href: "/privacy-policy", position: 12, type: "LEGAL" },
  { label: "Terms of Service", href: "/terms-of-service", position: 13, type: "LEGAL" },
] satisfies FooterCmsLink[];

export function footerGroupName(type?: string | null) {
  if (type === "QUICK_LINKS") return "Quick Links";
  if (type === "SERVICES") return "Services";
  if (type === "LEGAL") return "Legal";
  return type?.trim() ? type.trim().replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Other";
}

export function groupFooterLinks(links: FooterCmsLink[]) {
  const grouped = new Map<string, FooterCmsLink[]>();
  for (const link of [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    let type = link.type?.trim() || "QUICK_LINKS";
    if (type === "LINK") {
      type = ["Threat Detection", "Security Audits", "Cloud Protection", "Data Encryption"].includes(link.label)
        || link.href.includes("#threat-detection")
        || link.href.includes("#security-audits")
        || link.href.includes("#cloud-protection")
        || link.href.includes("#data-encryption")
        ? "SERVICES"
        : "QUICK_LINKS";
    }
    grouped.set(type, [...(grouped.get(type) ?? []), link]);
  }
  return [...grouped.entries()].map(([type, items]) => ({ type, title: footerGroupName(type), items }));
}
