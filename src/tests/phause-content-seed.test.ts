import { describe, expect, it } from "vitest";
import contentPack from "../../prisma/data/phause-content.json";

const avoidWords = ["bulletproof", "guaranteed prevention", "zero risk", "24/7 soc", "endpoint protection", "cloud firewall"];

function publishedStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(publishedStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(publishedStrings);
  return [];
}

describe("Phause content pack", () => {
  it("has the expected page, FAQ and post counts", () => {
    expect(contentPack.faqs).toHaveLength(24);
    expect(contentPack.posts).toHaveLength(4);
    expect(contentPack.pages.home.blocks.length).toBeGreaterThan(0);
  });

  it("keeps resources draft and omits newsletter and underscore-prefixed content", () => {
    expect(contentPack.pages.resources.status).toBe("PUBLISHED");
    expect(contentPack.pages.resources.newsletter.omit).toBe(true);
  });

  it("does not publish placeholder brackets or banned avoid words", () => {
    const publishable = {
      home: contentPack.pages.home,
      services: contentPack.pages.services,
      how: contentPack.pages["how-it-works"],
      solutions: contentPack.pages.solutions,
      about: contentPack.pages.about,
      subscription: contentPack.pages.subscription,
      faq: contentPack.pages.faq,
      contact: contentPack.pages.contact,
      security: { seo: contentPack.pages["security-policy"].seo, blocks: contentPack.pages["security-policy"].blocks },
      faqs: contentPack.faqs,
      posts: contentPack.posts,
      form: contentPack.forms,
    };
    const strings = publishedStrings(publishable);
    for (const text of strings) {
      expect(text).not.toMatch(/\[(?:placeholder|insert|describe|name|purpose|duration|scope)/i);
      if (!text.includes("Is Phause a managed security operations service") && !text.toLowerCase().includes("should not be confused with")) {
        for (const avoided of avoidWords) expect(text.toLowerCase()).not.toContain(avoided);
      }
    }
  });

  it("keeps legal page bodies blocked and only exposes SEO copy", () => {
    expect(contentPack.pages["privacy-policy"].status).toBe("SEO_ONLY");
    expect(contentPack.pages["terms-of-service"].status).toBe("SEO_ONLY");
    expect(contentPack.pages["cookie-policy"].status).toBe("SEO_ONLY");
    expect(contentPack.pages["responsible-disclosure"].status).toBe("SEO_ONLY");
  });

  it("uses the Reporting and Improvement category override", () => {
    const post = contentPack.posts.find((item) => item.slug === "turn-phishing-campaign-results-into-learning");
    expect(post?.slug).toBe("turn-phishing-campaign-results-into-learning");
  });
});
