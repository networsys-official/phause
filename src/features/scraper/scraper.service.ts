import { createHash } from "node:crypto";

import { load } from "cheerio";
import { chromium } from "playwright";

import { prisma } from "@/infrastructure/database/prisma";
import { SCRAPER_CONFIG } from "./scraper.config";
import type { ScrapeInput, ScrapeResult, ScrapedPage } from "./types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(input: string): string {
  try {
    return new URL(input).toString();
  } catch {
    return input;
  }
}

function getTextValue($: ReturnType<typeof load>, selector: string) {
  return ($(selector).first().text() ?? "").trim();
}

function toSlug(route: string) {
  const value = route.replace(/^\//, "").replace(/\/$/, "") || "home";
  return value.split("/").filter(Boolean).join("-") || "home";
}

function normalizeAssetUrl(baseUrl: string, input: string) {
  if (!input) return "";
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return input;
  }
}

function buildChecksum(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function inferMimeType(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  if (normalized.endsWith(".gif")) return "image/gif";
  return "image/png";
}

export class ScraperService {
  async persistScrapedSite(input: ScrapeInput) {
    const result = await this.scrapeSite(input);

    await prisma.$transaction(async (tx) => {
      const assets = new Set<string>();

      for (const page of result.pages) {
        const slug = toSlug(new URL(page.url).pathname);
        const title = page.title || "Untitled";

        const mediaByUrl = new Map<string, { id: string }>();

        for (const assetUrl of page.media) {
          const normalized = normalizeAssetUrl(page.url, assetUrl);
          if (!normalized || mediaByUrl.has(normalized)) continue;

          const checksum = buildChecksum(normalized);
          const mediaRecord = await tx.media.upsert({
            where: { checksum },
            update: {
              title: `Media ${slug}`,
              altText: title,
              url: normalized,
              mimeType: inferMimeType(normalized),
              status: "PUBLISHED",
              updatedAt: new Date(),
            },
            create: {
              slug: `media-${checksum.slice(0, 12)}`,
              title: `Media ${slug}`,
              filename: normalized.split("/").pop() || `${slug}.png`,
              altText: title,
              url: normalized,
              mimeType: inferMimeType(normalized),
              checksum,
              status: "PUBLISHED",
              version: 1,
            },
          });

          mediaByUrl.set(normalized, { id: mediaRecord.id });
        }

        const pageRecord = await tx.page.upsert({
          where: { slug },
          update: {
            title,
            status: "PUBLISHED",
            version: { increment: 1 },
            updatedAt: new Date(),
          },
          create: {
            slug,
            title,
            status: "PUBLISHED",
            version: 1,
          },
        });

        const seoRecord = await tx.seo.upsert({
          where: { slug },
          update: {
            title: page.metadata.title || title,
            description: page.metadata.description || page.description,
            keywords: page.metadata.keywords.join(",") || null,
            canonical: page.metadata.canonical || page.url,
          },
          create: {
            slug,
            title: page.metadata.title || title,
            description: page.metadata.description || page.description,
            keywords: page.metadata.keywords.join(",") || null,
            canonical: page.metadata.canonical || page.url,
          },
        });

        await tx.page.update({
          where: { id: pageRecord.id },
          data: { seoId: seoRecord.id },
        });

        const existingBlockCount = await tx.pageBlock.count({ where: { pageId: pageRecord.id } });

        if (existingBlockCount > 0) {
          await tx.pageBlock.deleteMany({ where: { pageId: pageRecord.id } });
        }

        if (page.blocks.length > 0) {
          for (const [index, block] of page.blocks.entries()) {
            const nextProps = { ...block.props } as Record<string, unknown>;
            const firstMedia = page.media[0];
            if (block.type === "hero" && firstMedia) {
              const normalizedFirst = normalizeAssetUrl(page.url, firstMedia);
              const mediaId = normalizedFirst ? mediaByUrl.get(normalizedFirst)?.id ?? null : null;
              nextProps.imageUrl = normalizedFirst || nextProps.imageUrl || "";
              nextProps.mediaId = mediaId ?? nextProps.mediaId ?? null;
            }

            await tx.pageBlock.create({
              data: {
                pageId: pageRecord.id,
                type: block.type.toUpperCase().replace(/-/g, "_") as never,
                order: block.order ?? index,
                props: nextProps as never,
                mediaId: block.type === "hero" && firstMedia ? mediaByUrl.get(normalizeAssetUrl(page.url, firstMedia) || "")?.id ?? null : null,
              },
            });
          }
        }

        for (const assetUrl of page.media) {
          const normalized = normalizeAssetUrl(page.url, assetUrl);
          if (!normalized || assets.has(normalized)) continue;
          assets.add(normalized);
        }
      }

      const allAssetUrls = [...assets];
      if (allAssetUrls.length > 0) {
        await tx.media.deleteMany({
          where: {
            deletedAt: null,
            url: { notIn: allAssetUrls },
          },
        });
      }

      const navSource = result.pages[0]?.navigation ?? [];
      const navRecord = await tx.navigation.upsert({
        where: { key: "main" },
        update: { label: "Main navigation", version: { increment: 1 }, updatedAt: new Date() },
        create: {
          key: "main",
          slug: "main-navigation",
          label: "Main navigation",
          href: "/",
          position: 0,
          status: "PUBLISHED",
          version: 1,
        },
      });

      await tx.navigationItem.deleteMany({ where: { navigationId: navRecord.id } });
      if (navSource.length > 0) {
        await tx.navigationItem.createMany({
          data: navSource.slice(0, 12).map((item, index) => ({
            navigationId: navRecord.id,
            label: item.label,
            href: item.href,
            position: index,
            status: "PUBLISHED",
          })),
        });
      }

      const footerLinks = result.pages[0]?.footer ?? [];
      const footerRecord = await tx.footer.upsert({
        where: { slug: "main-footer" },
        update: {
          title: "Phause",
          description: result.pages[0]?.description || "Phause cybersecurity platform",
          copyright: "© 2025 Phause. All rights reserved.",
          version: { increment: 1 },
          updatedAt: new Date(),
        },
        create: {
          slug: "main-footer",
          title: "Phause",
          description: result.pages[0]?.description || "Phause cybersecurity platform",
          copyright: "© 2025 Phause. All rights reserved.",
          status: "PUBLISHED",
          version: 1,
        },
      });

      await tx.footerLink.deleteMany({ where: { footerId: footerRecord.id } });
      if (footerLinks.length > 0) {
        await tx.footerLink.createMany({
          data: footerLinks.slice(0, 12).map((item, index) => ({
            footerId: footerRecord.id,
            label: item.label,
            href: item.href,
            position: index,
            type: item.href.startsWith("http") || item.href.startsWith("#") ? "SOCIAL" : "LINK",
            status: "PUBLISHED",
          })),
        });
      }
    });

    return result;
  }

  async scrapeSite(input: ScrapeInput): Promise<ScrapeResult> {
    const jobId = `scrape_${Date.now()}`;
    const warnings: string[] = [];
    const explicitRoutes = Array.from(
      new Set([
        normalizeUrl(input.url),
        ...(input.routes ?? ["/about", "/contact", "/subscription", "/registration"]),
      ]),
    ).map((route) => {
      try {
        return new URL(route, input.url).toString();
      } catch {
        return normalizeUrl(route);
      }
    });
    const queue: string[] = [...explicitRoutes];
    const seen = new Set<string>();
    const pages: ScrapedPage[] = [];

    while (queue.length > 0 && pages.length < input.limit) {
      const currentUrl = queue.shift();
      if (!currentUrl || seen.has(currentUrl)) continue;
      seen.add(currentUrl);

      try {
        const page = await this.fetchPage(currentUrl, input.mode, warnings);
        pages.push(page);

        if (input.maxDepth > 0 && pages.length < input.limit) {
          const internalLinks = [...new Set([...(page.links || []), page.metadata.canonical || currentUrl])];

          for (const link of internalLinks) {
            if (!seen.has(link) && queue.length < input.limit * 4) {
              queue.push(link);
            }
          }
        }
      } catch (error) {
        warnings.push(`Failed to scrape ${currentUrl}: ${(error as Error).message}`);
      }
    }

    return {
      jobId,
      pageCount: pages.length,
      pages,
      summary: {
        pages: pages.length,
        articles: pages.filter((page) => page.title.toLowerCase().includes("article")).length,
        faqs: pages.reduce((count, page) => count + page.faqItems.length, 0),
        images: pages.reduce((count, page) => count + page.media.length, 0),
        metadata: pages.length,
      },
      warnings,
    };
  }

  private async fetchPage(url: string, mode: ScrapeInput["mode"], warnings: string[]): Promise<ScrapedPage> {
    const html = await this.fetchHtml(url, mode, warnings);
    const $ = load(html);

    const title = $("title").first().text().trim() || $("meta[property='og:title']").attr("content") || "Untitled";
    const description =
      $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='twitter:description']").attr("content") ||
      "";
    const keywords = ($("meta[name='keywords']").attr("content") ?? "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const canonical = $("link[rel='canonical']").attr("href") || $("meta[property='og:url']").attr("content") || url;
    const robots = $("meta[name='robots']").attr("content") || "index,follow";
    const jsonLd = $('script[type="application/ld+json"]')
      .map((_, element) => {
        const raw = $(element).contents().text();
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .get()
      .filter(Boolean);

    const sourceOrigin = new URL(url).origin;
    const links = new Set<string>();

    $("a[href]")
      .each((_, element) => {
        const href = $(element).attr("href") ?? "";
        const trimmed = href.trim();
        if (!trimmed || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("javascript:") || trimmed.startsWith("#")) {
          return;
        }

        try {
          const parsed = new URL(trimmed, url);
          if (parsed.origin !== sourceOrigin) return;
          if (parsed.pathname === "/_next/static" || parsed.pathname.startsWith("/_next/")) return;
          links.add(parsed.toString());
        } catch {
          return;
        }
      });

    const navigation = $("nav a[href]")
      .map((_, element) => ({
        label: $(element).text().trim(),
        href: $(element).attr("href") ?? "",
      }))
      .get()
      .filter((item) => item.label && item.href)
      .slice(0, 12);

    const footer = $("footer a[href]")
      .map((_, element) => ({
        label: $(element).text().trim(),
        href: $(element).attr("href") ?? "",
      }))
      .get()
      .filter((item) => item.label && item.href)
      .slice(0, 12);

    const heroTitle = getTextValue($, "main h1") || getTextValue($, "h1");
    const heroDescription = getTextValue($, "main p") || getTextValue($, "p");
    const faqItems = $(".faq, details, .accordion, [data-faq]")
      .map((_, element) => {
        const question = $(element).find("h3, h4, summary").first().text().trim();
        const answer = $(element).find("p, div").first().text().trim();
        if (!question || !answer) return null;
        return { question, answer };
      })
      .get()
      .filter(Boolean) as Array<{ question: string; answer: string }>;

    const media = $("img[src]")
      .map((_, element) => $(element).attr("src") || "")
      .get()
      .filter(Boolean)
      .slice(0, 50);

    const primaryButtons = $("main a[href], main button")
      .map((_, element) => {
        const text = $(element).text().trim();
        const href = $(element).attr("href") ?? "";
        const value = text || $(element).val?.()?.toString() || "";
        const trimmed = value.trim();
        if (!trimmed || trimmed.length > 40 || trimmed.endsWith("?") || /^\d+$/.test(trimmed)) return null;
        if (href.startsWith("javascript:")) return null;
        if (/^(?:🇺🇸|🇮🇳|USA|India|US|IN|🇺🇸\s+USA|🇮🇳\s+India)$/i.test(trimmed)) return null;
        if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return null;
        if (trimmed.split(/\s+/).length < 2) return null;
        return { label: trimmed, href };
      })
      .get()
      .filter((item): item is { label: string; href: string } => Boolean(item && item.label));

    const heroCtaPrimary = primaryButtons[0]?.label ?? "Get Protected Now";
    const heroCtaSecondary = primaryButtons[1]?.label ?? "";
    const heroCtaPrimaryHref = primaryButtons[0]?.href ?? "/subscription";
    const heroCtaSecondaryHref = primaryButtons[1]?.href ?? "";
    const sectionHeadings = $("main h2, main h3")
      .map((_, element) => $(element).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 6);

    const sectionBlocks = sectionHeadings.map((heading, index) => ({
      type: "custom_section",
      order: index + 1,
      props: {
        eyebrow: "Phause",
        title: heading,
      },
    }));

    const structuredBlocks = [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: $("meta[property='og:site_name']").attr("content") || "Phause",
          title: heroTitle || title,
          description: heroDescription || description,
          ctaPrimary: heroCtaPrimary,
          ctaSecondary: heroCtaSecondary,
          ctaPrimaryHref: heroCtaPrimaryHref,
          ctaSecondaryHref: heroCtaSecondaryHref,
        },
      },
      ...sectionBlocks,
      {
        type: "faq",
        order: sectionBlocks.length + 1,
        props: { items: faqItems },
      },
    ];

    return {
      url,
      title,
      description,
      metadata: {
        title,
        description,
        keywords,
        canonical,
        robots,
        og: {
          title: $("meta[property='og:title']").attr("content") || title,
          description: $("meta[property='og:description']").attr("content") || description,
          image: $("meta[property='og:image']").attr("content") || "",
          url: $("meta[property='og:url']").attr("content") || canonical,
        },
        twitter: {
          card: $("meta[name='twitter:card']").attr("content") || "summary_large_image",
          title: $("meta[name='twitter:title']").attr("content") || title,
          description: $("meta[name='twitter:description']").attr("content") || description,
          image: $("meta[name='twitter:image']").attr("content") || "",
        },
        jsonLd,
      },
      navigation,
      footer,
      links: Array.from(links),
      hero: {
        eyebrow: $("meta[property='og:site_name']").attr("content") || "Phause",
        title: heroTitle || title,
        description: heroDescription || description,
        ctaLabel: $("a").first().text().trim() || "Learn more",
        ctaHref: $("a").first().attr("href") || "#",
      },
      faqItems,
      blocks: structuredBlocks,
      media,
    };
  }

  private async fetchHtml(url: string, mode: ScrapeInput["mode"], warnings: string[]): Promise<string> {
    let attempt = 0;
    while (attempt < SCRAPER_CONFIG.maxRetries) {
      try {
        const response = await fetch(url, {
          headers: SCRAPER_CONFIG.defaultHeaders,
          signal: AbortSignal.timeout(SCRAPER_CONFIG.requestTimeoutMs),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        if (mode === "browser" || (mode === "hybrid" && html.includes("<script"))) {
          const browserHtml = await this.renderWithBrowser(url, warnings);
          if (browserHtml) return browserHtml;
        }

        return html;
      } catch (error) {
        attempt += 1;
        if (attempt >= SCRAPER_CONFIG.maxRetries) {
          throw error;
        }
        warnings.push(`Retrying ${url} after network failure (${attempt}/${SCRAPER_CONFIG.maxRetries})`);
        await sleep(SCRAPER_CONFIG.initialBackoffMs * attempt);
      }
    }

    throw new Error(`Unable to fetch ${url}`);
  }

  private async renderWithBrowser(url: string, warnings: string[]): Promise<string | null> {
    if (!SCRAPER_CONFIG.allowBrowserFallback) return null;

    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const html = await page.content();
      await browser.close();
      return html;
    } catch (error) {
      warnings.push(`Browser fallback failed for ${url}: ${(error as Error).message}`);
      return null;
    }
  }
}

export const scraperService = new ScraperService();
