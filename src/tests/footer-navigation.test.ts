import { describe, expect, it } from "vitest";

import { groupFooterLinks } from "@/features/cms/footer-groups";

import {
  FOOTER_LEGAL_LINKS,
  FOOTER_QUICK_LINKS,
  FOOTER_SERVICE_LINKS,
  NAV_LINKS,
  validateFooterNavigation,
} from "@/lib/routes";

describe("footer navigation cleanup", () => {
  it("keeps the footer quick links high-value and route-based", () => {
    expect(FOOTER_QUICK_LINKS).toEqual([
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
      { label: "Subscription", href: "/subscription" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ]);
  });

  it("restores the valid service anchor links in the services column", () => {
    const serviceLabels = FOOTER_SERVICE_LINKS.map((item) => item.label);

    expect(serviceLabels).toEqual([
      "Threat Detection",
      "Security Audits",
      "Cloud Protection",
      "Data Encryption",
    ]);
    expect(FOOTER_SERVICE_LINKS).toEqual([
      { label: "Threat Detection", href: "/services#threat-detection" },
      { label: "Security Audits", href: "/services#security-audits" },
      { label: "Cloud Protection", href: "/services#cloud-protection" },
      { label: "Data Encryption", href: "/services#data-encryption" },
    ]);
    expect(serviceLabels.some((label) => ["Home", "About Us", "Blog", "FAQ", "Contact Us"].includes(label))).toBe(false);
  });

  it("defines a legal column with distinct pages", () => {
    expect(FOOTER_LEGAL_LINKS.map((item) => item.label)).toEqual([
      "Privacy Policy",
      "Terms of Service",
    ]);
    expect(new Set(FOOTER_LEGAL_LINKS.map((item) => item.label)).size).toBe(FOOTER_LEGAL_LINKS.length);
  });

  it("does not create duplicates within the footer and warns on header duplication without a hard fail", () => {
    const allFooterLabels = [...FOOTER_QUICK_LINKS, ...FOOTER_SERVICE_LINKS, ...FOOTER_LEGAL_LINKS].map((item) => item.label);
    expect(new Set(allFooterLabels).size).toBe(allFooterLabels.length);

    const duplicateHeaderLinks = FOOTER_QUICK_LINKS.filter((link) =>
      NAV_LINKS.some((headerLink) => headerLink.label === link.label && headerLink.href === link.href),
    );

    expect(duplicateHeaderLinks.length).toBeGreaterThan(0);
    expect(() => validateFooterNavigation()).not.toThrow();
  });

  it("renders published page links in CMS groups and excludes drafts", () => {
    const groups = groupFooterLinks([
      { label: "Threat Detection", href: "/services#threat-detection", position: 1, type: "SERVICES", status: "PUBLISHED" },
      { label: "New Published Page", href: "/new-published-page", position: 2, type: "SERVICES", status: "PUBLISHED" },
      { label: "Hidden Draft", href: "/hidden-draft", position: 3, type: "SERVICES", status: "DRAFT" },
    ].filter((link) => link.status === "PUBLISHED"));

    const services = groups.find((group) => group.type === "SERVICES");
    expect(services?.items.map((link) => link.label)).toEqual(["Threat Detection", "New Published Page"]);
    expect(services?.items.some((link) => link.label === "Hidden Draft")).toBe(false);
  });
});
