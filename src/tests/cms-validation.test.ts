import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SimpleCmsResourceManager } from "@/components/cms/resource-manager";
import {
  detectDuplicateItemIds,
  detectDuplicatePosition,
  detectDuplicateTimelineYears,
  hasPageChanges,
  isValidCmsUrl,
  validatePageSectionProps,
} from "@/features/cms/cms-service";
import { hasCmsRequestAccess, isPublicCmsReadRoute } from "@/lib/cms-access";

describe("CMS validation", () => {
  it("allows empty optional fields while rejecting malformed values", () => {
    const result = validatePageSectionProps(
      {
        id: "section-1",
        type: "hero",
        props: {
          title: "",
          subtitle: "",
          description: "",
          buttonText: "",
          buttonLink: "",
          image: "",
          position: "",
          visibility: true,
        },
      },
      [
        {
          id: "section-1",
          type: "hero",
          props: { title: "", subtitle: "", description: "", buttonText: "", buttonLink: "", position: "", visibility: true },
        },
      ],
    );

    expect(result).toEqual({});

    const invalidLink = validatePageSectionProps(
      {
        id: "section-2",
        type: "hero",
        props: { buttonLink: "ht!tp://bad-url", position: 1 },
      },
      [
        {
          id: "section-2",
          type: "hero",
          props: { buttonLink: "ht!tp://bad-url", position: 1 },
        },
      ],
    );

    expect(invalidLink.buttonLink).toBe("⚠️ Invalid URL format.");
  });

  it("accepts valid relative and absolute URLs and rejects malformed values", () => {
    expect(isValidCmsUrl("https://example.com")).toBe(true);
    expect(isValidCmsUrl("/about")).toBe(true);
    expect(isValidCmsUrl("#services")).toBe(true);
    expect(isValidCmsUrl("ht!tp://bad-url")).toBe(false);
  });

  it("detects duplicate positions and unchanged payloads", () => {
    expect(detectDuplicatePosition([{ id: "a", position: 3 }, { id: "b", position: 3 }])).toBe(true);
    expect(detectDuplicatePosition([{ id: "a", position: 1 }, { id: "b", position: 2 }])).toBe(false);
    expect(detectDuplicateItemIds([{ id: "service-1" }, { id: "service-1" }])).toBe(true);
    expect(detectDuplicateItemIds([{ id: "service-1" }, { id: "service-2" }])).toBe(false);
    expect(detectDuplicateTimelineYears([{ year: "2024" }, { year: "2024" }])).toBe(true);
    expect(detectDuplicateTimelineYears([{ year: "2024" }, { year: "2025" }])).toBe(false);
    expect(hasPageChanges([{ id: "a", props: { title: "Home" } }], [{ id: "a", props: { title: "Home" } }])).toBe(false);
    expect(hasPageChanges([{ id: "a", props: { title: "Home" } }], [{ id: "a", props: { title: "About" } }])).toBe(true);
  });

  it("allows authenticated or locally configured CMS requests without crashing on missing token", () => {
    const previousToken = process.env.CMS_PUBLIC_TOKEN;
    delete process.env.CMS_PUBLIC_TOKEN;

    expect(hasCmsRequestAccess(new Headers())).toBe(false);
    expect(hasCmsRequestAccess(new Headers({ Cookie: "next-auth.session-token=abc123" }))).toBe(true);
    expect(hasCmsRequestAccess(new Headers({ host: "localhost:3000" }))).toBe(true);
    expect(hasCmsRequestAccess(new Headers({ host: "127.0.0.1:3000" }))).toBe(true);

    process.env.CMS_PUBLIC_TOKEN = previousToken;
  });

  it("allows public GET reads for blog, FAQ and page data while keeping writes protected", () => {
    expect(isPublicCmsReadRoute("/api/cms/blog", "GET")).toBe(true);
    expect(isPublicCmsReadRoute("/api/cms/faqs", "GET")).toBe(true);
    expect(isPublicCmsReadRoute("/api/cms/pages", "GET")).toBe(true);
    expect(isPublicCmsReadRoute("/api/cms/blog", "POST")).toBe(false);
    expect(isPublicCmsReadRoute("/api/cms/forms", "GET")).toBe(false);
  });

  it("refreshes resource rows when fetched items arrive after initial render", () => {
    const { rerender } = render(
      React.createElement(SimpleCmsResourceManager, {
        title: "Frequently asked questions",
        description: "FAQ records",
        endpoint: "/api/cms/faqs",
        defaultItem: { question: "", answer: "", slug: "", status: "DRAFT" },
        fields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        ],
        itemName: "FAQ",
        initialItems: [],
        emptyState: { title: "No FAQs published yet", description: "Create your first question" },
      }),
    );

    expect(screen.getByText("No FAQs published yet")).toBeTruthy();

    rerender(
      React.createElement(SimpleCmsResourceManager, {
        title: "Frequently asked questions",
        description: "FAQ records",
        endpoint: "/api/cms/faqs",
        defaultItem: { question: "", answer: "", slug: "", status: "DRAFT" },
        fields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        ],
        itemName: "FAQ",
        initialItems: [{ id: "faq-1", question: "What is Phause?", answer: "Security platform", slug: "what-is-phause", status: "PUBLISHED" }],
        emptyState: { title: "No FAQs published yet", description: "Create your first question" },
      }),
    );

    expect(screen.getByText("What is Phause?")).toBeTruthy();
  });
});
