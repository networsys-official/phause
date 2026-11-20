export type CmsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

export type CmsBlockInput = {
  type: string;
  order?: number;
  props?: Record<string, unknown>;
  id?: string; // Added id field for block ID support
};

export type CmsPageInput = {
  slug: string;
  title: string;
  status: CmsStatus;
  blocks: CmsBlockInput[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    robots?: string;
  };
};

const VALID_STATUSES: CmsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"];

export function normalizeSlug(value: string) {
  const slug = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return slug || "page";
}

export function normalizeBlockType(type: string) {
  const key = (type ?? "custom-section").toString().trim();
  const compact = key.replace(/[^a-z0-9]+/gi, "").toLowerCase();

  const map: Record<string, string> = {
    hero: "hero",
    cta: "cta",
    ctabutton: "ctaButton",
    features: "features",
    services: "services",
    serviceshero: "servicesHero",
    servicesfeatures: "servicesFeatures",
    servicesprocess: "servicesProcess",
    servicesaudiences: "servicesAudiences",
    servicesbenefits: "servicesBenefits",
    servicesstats: "servicesStats",
    servicesfaq: "servicesFaq",
    servicescta: "servicesCta",
    homephilosophy: "homePhilosophy",
    homereasons: "homeReasons",
    homeservices: "homeServices",
    homeoffers: "homeOffers",
    homeprocess: "homeProcess",
    homecta: "homeCta",
    aboutcapabilities: "aboutCapabilities",
    aboutvalues: "aboutValues",
    aboutcommitments: "aboutCommitments",
    abouttimeline: "aboutTimeline",
    testimonials: "testimonials",
    gallery: "gallery",
    faq: "faq",
    stats: "stats",
    pricing: "pricing",
    team: "team",
    richtext: "richText",
    video: "video",
    contact: "contact",
    form: "form",
    customsection: "customSection",
  };

  return map[compact] ?? key.replace(/[-_\s]+([a-z])/g, (_, char) => char.toUpperCase()).replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function normalizePageInput(input: Partial<CmsPageInput> = {}): CmsPageInput {
  const title = (input.title ?? "Untitled page").toString().trim() || "Untitled page";
  const slug = normalizeSlug(input.slug ?? title);
  const status = VALID_STATUSES.includes((input.status as CmsStatus) ?? "DRAFT")
    ? ((input.status as CmsStatus) ?? "DRAFT")
    : "DRAFT";

  const blocks = (input.blocks ?? []).map((block, index) => ({
    type: normalizeBlockType(block?.type ?? "customSection"),
    order: typeof block?.order === "number" ? block.order : index,
    props: block?.props && typeof block.props === "object" ? block.props : {},
    id: block?.id, // Preserve block ID if it exists
  }));

  return {
    slug,
    title,
    status,
    blocks,
    seo: input.seo ? {
    ...input.seo,
    keywords: Array.isArray(input.seo.keywords)
      ? input.seo.keywords
      : typeof (input.seo as unknown as { keywords?: unknown }).keywords === "string"
        ? String((input.seo as unknown as { keywords: string }).keywords).split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
        : [],
  } : {},
  };
}

export function normalizeNavigationItems(items: Array<{ label?: string; href?: string; position?: number }>) {
  return (items ?? [])
    .map((item, index) => ({
      label: (item.label ?? "Untitled").toString().trim() || `Link ${index + 1}`,
      href: (item.href ?? "/").toString().trim() || "/",
      position: Number.isFinite(item.position) ? Number(item.position) : index,
    }))
    .sort((left, right) => left.position - right.position)
    .map((item, index) => ({ ...item, position: index }));
}

export function normalizeFooterLinks(items: Array<{ label?: string; href?: string; position?: number }>) {
  return (items ?? [])
    .map((item, index) => ({
      label: (item.label ?? "Untitled").toString().trim() || `Link ${index + 1}`,
      href: (item.href ?? "/").toString().trim() || "/",
      position: Number.isFinite(item.position) ? Number(item.position) : index,
    }))
    .sort((left, right) => left.position - right.position)
    .map((item, index) => ({ ...item, position: index }));
}

export function isEmptyCmsValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

export function isValidCmsUrl(value: string | null | undefined) {
  if (isEmptyCmsValue(value)) return true;

  const candidate = String(value).trim();
  if (/^(?:\/|#|mailto:|tel:)/i.test(candidate)) {
    return true;
  }

  if (!/^https?:\/\//.test(candidate)) {
    return false;
  }

  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function detectDuplicatePosition(items: Array<{ id?: string; position?: unknown }>) {
  const seen = new Map<number, string | undefined>();

  for (const item of items) {
    const rawPosition = item.position;
    if (isEmptyCmsValue(rawPosition)) continue;

    const numericPosition = Number(rawPosition);
    if (!Number.isInteger(numericPosition) || numericPosition < 0) continue;

    const existingId = seen.get(numericPosition);
    if (existingId && existingId !== item.id) {
      return true;
    }

    seen.set(numericPosition, item.id);
  }

  return false;
}

export function detectDuplicateItemIds(items: Array<{ id?: string; itemId?: string }>) {
  const seen = new Map<string, string | undefined>();

  for (const item of items) {
    const rawId = item.id ?? item.itemId;
    if (isEmptyCmsValue(rawId)) continue;

    const normalizedId = String(rawId).trim();
    if (!normalizedId) continue;

    if (seen.has(normalizedId)) {
      return true;
    }

    seen.set(normalizedId, rawId);
  }

  return false;
}

export function detectDuplicateTimelineYears(items: Array<{ year?: unknown; id?: string }>) {
  const seen = new Map<string, string | undefined>();

  for (const item of items) {
    const rawYear = item.year;
    if (isEmptyCmsValue(rawYear)) continue;

    const normalizedYear = String(rawYear).trim();
    if (!normalizedYear) continue;

    if (seen.has(normalizedYear)) {
      return true;
    }

    seen.set(normalizedYear, item.id);
  }

  return false;
}

export function validatePageSectionProps(
  section: { id?: string; type?: string; props?: Record<string, unknown> },
  sections: Array<{ id?: string; type?: string; props?: Record<string, unknown> }> = [],
  mediaUrls: string[] = [],
): Record<string, string> {
  const props = section?.props ?? {};
  const errors: Record<string, string> = {};

  const textFields = ["title", "subtitle", "description", "buttonText"] as const;
  for (const field of textFields) {
    const value = props[field];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value !== "string") {
      errors[field] = `⚠️ ${field === "buttonText" ? "Button text" : field.charAt(0).toUpperCase() + field.slice(1)} must be text.`;
    }
  }

  const buttonLinkValue = props.buttonLink;
  if (!isEmptyCmsValue(buttonLinkValue) && typeof buttonLinkValue !== "string") {
    errors.buttonLink = "⚠️ Invalid URL format.";
  } else if (typeof buttonLinkValue === "string" && buttonLinkValue.trim() && !isValidCmsUrl(buttonLinkValue)) {
    errors.buttonLink = "⚠️ Invalid URL format.";
  }

  const rawPosition = props.position;
  if (!isEmptyCmsValue(rawPosition)) {
    const numericPosition = Number(rawPosition);
    if (!Number.isInteger(numericPosition) || numericPosition < 0) {
      errors.position = "⚠️ Position must be a non-negative integer.";
    } else {
      const duplicatePosition = sections.some(
        (candidate) => candidate.id !== section.id && !isEmptyCmsValue(candidate?.props?.position) && Number(candidate?.props?.position) === numericPosition,
      );

      if (duplicatePosition) {
        errors.position = "⚠️ Position already exists.";
      }
    }
  }

  if (props.visibility !== undefined && typeof props.visibility !== "boolean") {
    errors.visibility = "⚠️ Visibility must be true or false.";
  }

  if (Array.isArray(props.items)) {
    const itemRecords = props.items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        id: typeof item.id === "string" ? item.id : typeof item.itemId === "string" ? item.itemId : undefined,
        position: item.position ?? item.order,
        year: item.year,
      }));

    if (detectDuplicateItemIds(itemRecords.map(({ id }) => ({ id })))) {
      errors.items = "⚠️ Duplicate item ID found.";
    }

    if (detectDuplicatePosition(itemRecords.map(({ id, position }) => ({ id, position })))) {
      errors.items = "⚠️ Duplicate item position found.";
    }

    if (detectDuplicateTimelineYears(itemRecords)) {
      errors.items = "⚠️ Duplicate timeline year found.";
    }
  }

  const imageValue = props.image;
  if (!isEmptyCmsValue(imageValue)) {
    const imageText = String(imageValue).trim();
    if (mediaUrls.length > 0 && !mediaUrls.includes(imageText)) {
      errors.image = "⚠️ Selected image no longer exists.";
    }
  }

  return errors;
}

export function hasPageChanges(current: unknown, previous: unknown) {
  const normalize = (input: unknown): string => {
    const normalized = JSON.stringify(input, (_key, value) => {
      if (typeof value === "undefined") return "__undefined__";
      if (value instanceof Date) return value.toISOString();
      if (value === null) return null;
      return value;
    });

    return normalized ?? "";
  };

  return normalize(current) !== normalize(previous);
}
