import { describe, expect, it } from "vitest";

import { normalizePageInput, normalizeSlug } from "@/features/cms/cms-service";

describe("cms service", () => {
  it("normalizes slugs and block ordering", () => {
    const page = normalizePageInput({
      slug: " My Page ",
      title: "My Page",
      status: "PUBLISHED",
      blocks: [
        { type: "hero", props: { title: "Hello" } },
        { type: "faq", props: { question: "Why?" } },
      ],
    });

    expect(normalizeSlug(" My Page ")).toBe("my-page");
    expect(page.slug).toBe("my-page");
    expect(page.blocks[0]?.order).toBe(0);
    expect(page.blocks[1]?.order).toBe(1);
  });
});
