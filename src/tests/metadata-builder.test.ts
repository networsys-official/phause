import { describe, expect, it } from "vitest";

import { buildMetadata } from "@/features/seo/metadata-builder";

describe("metadata builder", () => {
  it("creates canonical metadata from page inputs", () => {
    const metadata = buildMetadata({
      title: "About Phause",
      description: "Learn about Phause security operations and protections.",
      keywords: ["cybersecurity", "phause", "threat detection"],
      canonical: "https://phause.com/about",
      baseUrl: "https://phause.com",
    });

    expect(metadata.title).toBe("About Phause");
    expect(metadata.description).toContain("Phause security operations");
    expect(metadata.alternates?.canonical).toBe("https://phause.com/about");
  });
});
