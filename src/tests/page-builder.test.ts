import { describe, expect, it } from "vitest";

import { buildPage, getBlockProp, normalizeEditableBlockProps, serializeContactDetails, toBlockPayload } from "@/features/cms/page-builder";
import { normalizeServiceRecord } from "@/app/api/cms/services/route";

describe("page builder", () => {
  it("sorts blocks by order and keeps registry data intact", () => {
    const page = buildPage({
      slug: "home",
      title: "Home",
      status: "PUBLISHED",
      blocks: [
        { id: "block-2", type: "cta", order: 2, props: { title: "Get started" } },
        { id: "block-1", type: "hero", order: 0, props: { title: "Welcome" } },
      ],
    });

    expect(page.blocks.map((block) => block.order)).toEqual([0, 2]);
    expect(page.blocks[0]?.props.title).toBe("Welcome");
    expect(page.blocks[1]?.type).toBe("cta");
  });

  it("normalizes enterprise CMS block types without mutating the registry contract", () => {
    const page = buildPage({
      slug: "contact",
      title: "Contact",
      status: "PUBLISHED",
      blocks: [
        {
          id: "contact-block",
          type: "contact",
          order: 0,
          props: { title: "Book a demo", description: "We reply in under 30 minutes." },
        },
      ],
    });

    expect(page.blocks[0]?.type).toBe("contact");
    expect(page.blocks[0]?.props.title).toBe("Book a demo");
    expect(page.blocks[0]?.props.description).toBe("We reply in under 30 minutes.");
  });

  it("normalizes editable section fields and preserves CTA data for block editing", () => {
    const normalized = normalizeEditableBlockProps({
      title: "Threat Detection",
      subtitle: "24/7 monitoring",
      description: "We protect your edges in real time.",
      buttonText: "Book a demo",
      buttonLink: "/contact",
      image: "/media/feature.png",
      visibility: true,
      position: 2,
      ctaPrimary: "Legacy CTA",
      ctaPrimaryHref: "/legacy",
    });

    expect(normalized.title).toBe("Threat Detection");
    expect(normalized.buttonText).toBe("Book a demo");
    expect(normalized.buttonLink).toBe("/contact");
    expect(normalized.image).toBe("/media/feature.png");
    expect(normalized.visibility).toBe(true);
    expect(normalized.position).toBe(2);

    const payload = toBlockPayload({
      id: "block-1",
      type: "hero",
      order: 2,
      props: {
        title: "Threat Detection",
        description: "We protect your edges in real time.",
      },
    });

    expect(payload.props.title).toBe("Threat Detection");
    expect(payload.props.position).toBe(2);
    expect(payload.props.visibility).toBe(true);
  });

  it("reads the live CMS block values for visible content fields", () => {
    const block = {
      id: "hero-block",
      type: "hero",
      order: 0,
      props: {
        title: "New hero headline",
        subtitle: "Updated subtitle",
        description: "Updated description",
        buttonText: "Start free",
        buttonLink: "/register",
        image: "/media/hero.png",
        visibility: true,
      },
    } as const;

    expect(getBlockProp(block.props, "title", "Default title")).toBe("New hero headline");
    expect(getBlockProp(block.props, "subtitle", "Default subtitle")).toBe("Updated subtitle");
    expect(getBlockProp(block.props, "description", "Default description")).toBe("Updated description");
    expect(getBlockProp(block.props, "buttonText", "Default CTA")).toBe("Start free");
    expect(getBlockProp(block.props, "buttonLink", "/fallback")).toBe("/register");
    expect(getBlockProp(block.props, "image", "/fallback.png")).toBe("/media/hero.png");
    expect(getBlockProp(block.props, "visibility", false)).toBe(true);
  });

  it("accepts the services block family used by the CMS schema", () => {
    const page = buildPage({
      slug: "services",
      title: "Services",
      status: "PUBLISHED",
      blocks: [
        { id: "services-hero", type: "servicesHero", order: 0, props: { eyebrow: "Security services", title: "Updated title", description: "Ready to help." } },
        { id: "services-process", type: "servicesProcess", order: 1, props: { items: [{ id: "step-1", title: "Understand" }, { id: "step-2", title: "Assess" }] } },
      ],
    });

    expect(page.blocks[0]?.type).toBe("servicesHero");
    expect(page.blocks[1]?.props.items).toHaveLength(2);
  });

  it("accepts the about block family used by the CMS schema", () => {
    const page = buildPage({
      slug: "about",
      title: "About",
      status: "PUBLISHED",
      blocks: [
        { id: "about-capabilities", type: "aboutCapabilities", order: 0, props: { items: [{ id: "capability-1", title: "Detection" }] } },
        { id: "about-timeline", type: "aboutTimeline", order: 1, props: { items: [{ id: "milestone-1", year: "2024", title: "Launch" }] } },
      ],
    });

    expect(page.blocks[0]?.type).toBe("aboutCapabilities");
    expect(page.blocks[1]?.props.items).toHaveLength(1);
  });

  it("accepts the home block family used by the CMS schema", () => {
    const page = buildPage({
      slug: "home",
      title: "Home",
      status: "PUBLISHED",
      blocks: [
        { id: "home-philosophy", type: "homePhilosophy", order: 0, props: { items: [{ id: "p-1", title: "Clear defense" }] } },
        { id: "home-services", type: "homeServices", order: 1, props: { items: [{ id: "s-1", title: "Monitoring" }] } },
      ],
    });

    expect(page.blocks[0]?.type).toBe("homePhilosophy");
    expect(page.blocks[1]?.props.items).toHaveLength(1);
  });

  it("serializes contact detail cards for the CMS editor and public page", () => {
    const details = serializeContactDetails([
      { label: "Email Us", value: "hello@phause.com", note: "General inquiries" },
      { label: "Call Us", value: "+1 (555) 010-PHAUSE", note: "24/7 response desk" },
    ]);

    expect(details).toHaveLength(2);
    expect(details[0]).toMatchObject({ label: "Email Us", value: "hello@phause.com", note: "General inquiries" });
    expect(details[1]).toMatchObject({ label: "Call Us", value: "+1 (555) 010-PHAUSE", note: "24/7 response desk" });
  });

  it("normalizes uppercase CMS block types to the expected lowercase value", () => {
    const page = buildPage({
      slug: "contact",
      title: "Contact",
      status: "PUBLISHED",
      blocks: [{ id: "contact-block", type: "CONTACT", order: 0, props: { title: "Book a demo" } }],
    });

    expect(page.blocks[0]?.type).toBe("contact");
  });

  it("preserves uploaded service images for the public services UI", () => {
    const normalized = normalizeServiceRecord({
      id: "feature-1",
      slug: "service-one",
      title: "Service One",
      description: "This is a service description.",
      image: "data:image/png;base64,abc123",
      status: "PUBLISHED",
    });

    expect(normalized.image).toBe("data:image/png;base64,abc123");
    expect(normalized.description).toBe("This is a service description.");
  });
});
