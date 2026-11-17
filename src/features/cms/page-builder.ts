export type CmsBlockType =
  | "hero"
  | "cta"
  | "ctaButton"
  | "features"
  | "services"
  | "servicesHero"
  | "servicesFeatures"
  | "servicesProcess"
  | "servicesAudiences"
  | "servicesBenefits"
  | "servicesStats"
  | "servicesFaq"
  | "servicesCta"
  | "homePhilosophy"
  | "homeReasons"
  | "homeServices"
  | "homeOffers"
  | "homeProcess"
  | "homeCta"
  | "aboutCapabilities"
  | "aboutValues"
  | "aboutCommitments"
  | "aboutTimeline"
  | "testimonials"
  | "gallery"
  | "faq"
  | "stats"
  | "pricing"
  | "team"
  | "richText"
  | "video"
  | "contact"
  | "form"
  | "customSection";

export type CmsBlock = {
  id: string;
  type: CmsBlockType;
  order: number;
  props: Record<string, unknown>;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
  blocks: CmsBlock[];
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    keywords?: string[];
  };
};

export const pageBlockRegistry = {
  hero: (props: Record<string, unknown>) => ({ ...props }),
  cta: (props: Record<string, unknown>) => ({ ...props }),
  ctaButton: (props: Record<string, unknown>) => ({ label: props.label ?? "Get started", href: props.href ?? "/contact", title: props.title ?? "Action" }),
  features: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  services: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesHero: (props: Record<string, unknown>) => ({ ...props }),
  servicesFeatures: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesProcess: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesAudiences: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesBenefits: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesStats: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesFaq: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  servicesCta: (props: Record<string, unknown>) => ({ ...props }),
  homePhilosophy: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  homeReasons: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  homeServices: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  homeOffers: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  homeProcess: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  homeCta: (props: Record<string, unknown>) => ({ ...props }),
  aboutCapabilities: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  aboutValues: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  aboutCommitments: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  aboutTimeline: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  testimonials: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  gallery: (props: Record<string, unknown>) => ({ images: props.images ?? [] }),
  faq: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  stats: (props: Record<string, unknown>) => ({ items: props.items ?? [] }),
  pricing: (props: Record<string, unknown>) => ({ plans: props.plans ?? [] }),
  team: (props: Record<string, unknown>) => ({ members: props.members ?? [] }),
  richText: (props: Record<string, unknown>) => ({ content: props.content ?? "" }),
  video: (props: Record<string, unknown>) => ({ src: props.src ?? "", poster: props.poster ?? "" }),
  contact: (props: Record<string, unknown>) => ({ title: props.title ?? "Contact", description: props.description ?? "", details: props.details ?? [] }),
  form: (props: Record<string, unknown>) => ({ formId: props.formId ?? "", fields: props.fields ?? [] }),
  customSection: (props: Record<string, unknown>) => ({ ...props }),
} as const;

export function sortBlocks(blocks: CmsBlock[]) {
  return [...blocks].sort((left, right) => left.order - right.order);
}

export type EditableBlockProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  visibility?: boolean;
  position?: number;
  [key: string]: unknown;
};

export function getBlockProp<T = string>(
  props: Record<string, unknown> = {},
  key: string,
  fallback: T = "" as T,
): T {
  const aliases: Record<string, string[]> = {
    title: ["title"],
    subtitle: ["subtitle"],
    description: ["description"],
    buttonText: ["buttonText", "ctaPrimary"],
    buttonLink: ["buttonLink", "ctaPrimaryHref"],
    secondaryButtonText: ["secondaryButtonText", "ctaSecondary"],
    secondaryButtonLink: ["secondaryButtonLink", "ctaSecondaryHref"],
    image: ["image", "imageUrl", "mediaUrl"],
    eyebrow: ["eyebrow", "tag"],
    visibility: ["visibility"],
    order: ["order", "position"],
  };

  const candidates = [key, ...(aliases[key] ?? [])];

  for (const candidate of candidates) {
    const value = props[candidate];
    if (typeof value !== "undefined" && value !== null && !(typeof value === "string" && value.trim() === "")) {
      return value as T;
    }
  }

  return fallback;
}

export function normalizeEditableBlockProps(props: Record<string, unknown> = {}): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...props };

  if (typeof normalized.type === "string") {
    normalized.type = normalized.type.toLowerCase();
  }

  if (typeof normalized.title === "string") normalized.title = normalized.title;
  if (typeof normalized.subtitle === "string") normalized.subtitle = normalized.subtitle;
  if (typeof normalized.description === "string") normalized.description = normalized.description;
  if (typeof normalized.buttonText === "string") normalized.buttonText = normalized.buttonText;
  if (typeof normalized.buttonLink === "string") normalized.buttonLink = normalized.buttonLink;
  if (typeof normalized.image === "string") normalized.image = normalized.image;
  if (typeof normalized.visibility === "boolean") normalized.visibility = normalized.visibility;
  if (typeof normalized.position === "number") normalized.position = normalized.position;

  if (typeof normalized.ctaPrimary === "string" && typeof normalized.buttonText !== "string") {
    normalized.buttonText = normalized.ctaPrimary;
  }
  if (typeof normalized.ctaPrimaryHref === "string" && typeof normalized.buttonLink !== "string") {
    normalized.buttonLink = normalized.ctaPrimaryHref;
  }
  if (Array.isArray(normalized.details)) {
    normalized.details = serializeContactDetails(normalized.details);
  }

  return normalized;
}

export function serializeContactDetails(details: unknown): Array<{ id: string; label: string; value: string; note: string }> {
  if (!Array.isArray(details)) {
    return [];
  }

  const normalized = details
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const label = typeof item.label === "string" ? item.label : "";
      const value = typeof item.value === "string" ? item.value : typeof item.text === "string" ? item.text : "";
      const note = typeof item.note === "string" ? item.note : "";

      return {
        id: typeof item.id === "string" ? item.id : `contact-detail-${index + 1}`,
        label,
        value,
        note,
      };
    });

  return normalized.filter((item) => item.label || item.value || item.note);
}

export function toBlockPayload(block: CmsBlock | { id: string; type: string; order: number; props: Record<string, unknown> }) {
  const normalizedProps = normalizeEditableBlockProps(block.props ?? {});
  return {
    id: block.id,
    type: String(block.type ?? "").toLowerCase(),
    order: block.order,
    props: {
      ...normalizedProps,
      title: normalizedProps.title ?? "",
      description: normalizedProps.description ?? "",
      visibility: normalizedProps.visibility ?? true,
      position: normalizedProps.position ?? block.order,
    },
  };
}

export function buildPage(input: Omit<CmsPage, "id" | "blocks"> & { id?: string; blocks?: Array<Omit<CmsBlock, "type"> & { type: string }> }): CmsPage {
  const blockMap = pageBlockRegistry as Record<string, (props: Record<string, unknown>) => Record<string, unknown>>;
  const blocks = sortBlocks(
    (input.blocks ?? []).map((block) => {
      const normalizedType = String(block.type ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, "");
      const normalizedName = normalizedType === "serviceshero" ? "servicesHero"
        : normalizedType === "servicesfeatures" ? "servicesFeatures"
        : normalizedType === "servicesprocess" ? "servicesProcess"
        : normalizedType === "servicesaudiences" ? "servicesAudiences"
        : normalizedType === "servicesbenefits" ? "servicesBenefits"
        : normalizedType === "servicesstats" ? "servicesStats"
        : normalizedType === "servicesfaq" ? "servicesFaq"
        : normalizedType === "servicescta" ? "servicesCta"
        : normalizedType === "homephilosophy" ? "homePhilosophy"
        : normalizedType === "homereasons" ? "homeReasons"
        : normalizedType === "homeservices" ? "homeServices"
        : normalizedType === "homeoffers" ? "homeOffers"
        : normalizedType === "homeprocess" ? "homeProcess"
        : normalizedType === "homecta" ? "homeCta"
        : normalizedType === "aboutcapabilities" ? "aboutCapabilities"
        : normalizedType === "aboutvalues" ? "aboutValues"
        : normalizedType === "aboutcommitments" ? "aboutCommitments"
        : normalizedType === "abouttimeline" ? "aboutTimeline"
        : normalizedType === "contact" ? "contact"
        : normalizedType;

      const resolver = blockMap[normalizedName as keyof typeof blockMap] ?? blockMap[block.type as keyof typeof blockMap] ?? ((props: Record<string, unknown>) => ({ ...props }));

      return {
        ...block,
        type: (normalizedName || "customSection") as CmsBlockType,
        props: resolver(block.props ?? {}),
      };
    }),
  );

  return {
    id: input.id ?? crypto.randomUUID(),
    slug: input.slug,
    title: input.title,
    status: input.status,
    blocks,
    seo: input.seo,
  };
}
