import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    page: { findFirst: vi.fn() },
    setting: { findFirst: vi.fn() },
    navigation: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/infrastructure/database/prisma";
import { hasDefaultCmsContent } from "@/features/cms/content-service";
import {
  createFallbackItemTitle,
  createServiceNumber,
  extractCmsSectionItems,
  getDefaultHomeOffers,
  getDefaultHomeReasons,
  getDefaultHomeServices,
  getDefaultHomeSteps,
} from "../features/cms/home-fallbacks";
import { normalizeEditableSectionItems } from "../components/cms/content-editors";

describe("homepage fallback content", () => {
  it("generates unique fallback philosophy titles", () => {
    const titles = Array.from({ length: 3 }, (_, index) => createFallbackItemTitle("Principle", index));

    expect(titles).toEqual(["Principle 1", "Principle 2", "Principle 3"]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("generates unique fallback service numbers", () => {
    const numbers = Array.from({ length: 5 }, (_, index) => createServiceNumber(index));

    expect(numbers).toEqual(["01", "02", "03", "04", "05"]);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("generates phishing-awareness fallback reason titles for the homepage", () => {
    const reasons = getDefaultHomeReasons();
    const titles = reasons.map((reason) => reason.title);

    expect(titles).toEqual([
      "A clearer programme workflow",
      "More controlled campaign planning",
      "More useful reporting conversations",
      "Follow-through that supports learning",
    ]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("generates neutral fallback service, offer, and step titles", () => {
    const serviceTitles = getDefaultHomeServices().map((item) => item.title);
    const offerTitles = getDefaultHomeOffers();
    const stepTitles = getDefaultHomeSteps().map((item) => item.title);

    expect(serviceTitles).toEqual([
      "Employee Management",
      "Phishing Templates",
      "Campaign Management",
      "Reporting and Risk Insights",
    ]);
    expect(offerTitles).toEqual([]);
    expect(new Set(stepTitles).size).toBe(stepTitles.length);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses saved section metadata as a real dynamic section when no item array exists", () => {
    const items = extractCmsSectionItems({
      title: "Plan. Simulate. Learn. Improve.",
      subtitle: "A practical phishing-awareness programme cycle.",
      description: "Build an authorised exercise around a clear learning objective.",
    }, []);

    expect(items).toEqual([
      {
        title: "Plan. Simulate. Learn. Improve.",
        subtitle: "A practical phishing-awareness programme cycle.",
        description: "Build an authorised exercise around a clear learning objective.",
      },
    ]);
  });

  it("accepts alternate CMS array keys so sections stay dynamic instead of falling back to static defaults", () => {
    const items = extractCmsSectionItems({
      sections: [
        { title: "Threat detection", description: "Monitor every signal in real time." },
        { title: "Rapid response", description: "Contain issues before they become incidents." },
      ],
    }, []);

    expect(items).toEqual([
      { title: "Threat detection", description: "Monitor every signal in real time." },
      { title: "Rapid response", description: "Contain issues before they become incidents." },
    ]);
  });

  it("normalizes list-based CMS section data so all home-page cards remain editable", () => {
    const items = normalizeEditableSectionItems("homeReasons", [
      { id: "reason-1", icon: "shield", title: "Clear programme workflow", description: "Connected campaign management" },
      { id: "faq-1", question: "How are results used?", answer: "To plan relevant follow-up learning" },
    ]);

    expect(items).toMatchObject([
      { id: "reason-1", title: "Clear programme workflow", description: "Connected campaign management", icon: "shield" },
      { id: "faq-1", question: "How are results used?", answer: "To plan relevant follow-up learning" },
    ]);
  });

  it("skips CMS bootstrap when the default seeded data already exists", async () => {
    vi.mocked(prisma.page.findFirst).mockResolvedValue({ id: "page-1" } as never);
    vi.mocked(prisma.setting.findFirst).mockResolvedValue({ id: "setting-1" } as never);
    vi.mocked(prisma.navigation.findFirst).mockResolvedValue({ id: "nav-1" } as never);

    await expect(hasDefaultCmsContent()).resolves.toBe(true);
  });
});
