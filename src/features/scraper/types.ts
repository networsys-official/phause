export type ScrapeMode = "static" | "hybrid" | "browser";

export type ScrapedMetadata = {
  title?: string;
  description?: string;
  keywords: string[];
  canonical?: string;
  robots?: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: unknown[];
};

export type ScrapedNavigationItem = {
  label: string;
  href: string;
};

export type ScrapedPage = {
  url: string;
  title: string;
  description: string;
  metadata: ScrapedMetadata;
  navigation: ScrapedNavigationItem[];
  footer: ScrapedNavigationItem[];
  links: string[];
  hero: {
    eyebrow?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  faqItems: Array<{ question: string; answer: string }>;
  blocks: Array<{ type: string; order: number; props: Record<string, unknown> }>;
  media: string[];
};

export type ScrapeInput = {
  url: string;
  mode: ScrapeMode;
  maxDepth: number;
  limit: number;
  includeMedia: boolean;
  incremental: boolean;
  routes?: string[];
};

export type ScrapeResult = {
  jobId: string;
  pageCount: number;
  pages: ScrapedPage[];
  summary: {
    pages: number;
    articles: number;
    faqs: number;
    images: number;
    metadata: number;
  };
  warnings: string[];
};
