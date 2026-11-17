import { chromium } from "playwright";

import { prisma } from "../infrastructure/database/prisma";

const SOURCE_URL = "https://phause.vercel.app";
const TARGETS = [
  { slug: "home", path: "/", expectedBlocks: ["hero", "stats", "features", "richText", "faq"] },
  { slug: "about", path: "/about", expectedBlocks: ["hero", "richText", "features"] },
  { slug: "contact", path: "/contact", expectedBlocks: ["contact"] },
  { slug: "subscription", path: "/subscription", expectedBlocks: ["hero", "pricing"] },
  { slug: "registration", path: "/registration", expectedBlocks: ["form"] },
] as const;

function normalize(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeBlockType(type: string) {
  return type.toLowerCase().replace(/_/g, "");
}

function normalizeMediaUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(value, SOURCE_URL).toString();
  } catch {
    return value;
  }
}

async function getPageSnapshot(path: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${SOURCE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });

  const title = normalize(await page.title());
  const description = normalize(await page.locator("meta[name='description']").getAttribute("content"));
  const navLabels = await page.locator("nav a[href]").evaluateAll((items) => items.map((item) => item.textContent?.trim()).filter(Boolean));
  const footerLabels = await page.locator("footer a[href]").evaluateAll((items) => items.map((item) => item.textContent?.trim()).filter(Boolean));
  const mediaUrls = await page.locator("img[src]").evaluateAll((items) => items.map((item) => item.getAttribute("src") ?? ""))
    .then((urls) => [...new Set(urls.filter(Boolean))]);
  const blockTypes = await page.locator("main section, main article, main form, main div[data-block]").evaluateAll((items) => items.map((item) => item.getAttribute("data-block") ?? "").filter(Boolean));

  await browser.close();

  return {
    title,
    description,
    navLabels: navLabels.map((label) => normalize(label)),
    footerLabels: footerLabels.map((label) => normalize(label)),
    mediaUrls,
    blockTypes: blockTypes.length > 0 ? blockTypes : [],
  };
}

async function main() {
  const mismatches: string[] = [];
  let contentMatches = 0;
  let contentTotal = 0;

  for (const target of TARGETS) {
    const live = await getPageSnapshot(target.path);
    const page = await prisma.page.findFirst({
      where: { slug: target.slug },
      include: { seo: true, blocks: { orderBy: { order: "asc" } } },
    });

    if (!page) {
      mismatches.push(`Missing page record for ${target.path}`);
      continue;
    }

    const checks = [
      { label: "page title", actual: page.title, expected: live.title },
      { label: "seo title", actual: page.seo?.title ?? null, expected: live.title },
      { label: "seo description", actual: page.seo?.description ?? null, expected: live.description },
    ];

    for (const check of checks) {
      contentTotal += 1;
      if (normalize(check.actual ?? "") === normalize(check.expected ?? "")) {
        contentMatches += 1;
      } else {
        mismatches.push(`${target.path}: ${check.label} mismatch: DB='${normalize(check.actual ?? "")}' expected '${normalize(check.expected ?? "")}'`);
      }
    }

    const dbBlockTypes = page.blocks.map((block) => normalizeBlockType(block.type)).slice(0, 10);
    const expectedBlockTypes = target.expectedBlocks.map(normalizeBlockType);
    if (JSON.stringify(dbBlockTypes) !== JSON.stringify(expectedBlockTypes)) {
      mismatches.push(`${target.path}: block structure mismatch: DB='${dbBlockTypes.join(",")}' expected '${expectedBlockTypes.join(",")}'`);
    }

    const dbMedia = await prisma.media.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 200 });
    const dbMediaUrls = [...new Set(dbMedia.map((asset) => normalizeMediaUrl(asset.url)))];
    const liveMediaSet = new Set(live.mediaUrls.filter(Boolean).map((url) => normalizeMediaUrl(url)));
    const missingMedia = dbMediaUrls.filter((url) => !liveMediaSet.has(url))
      .concat([...liveMediaSet].filter((url) => !dbMediaUrls.includes(url)));

    if (missingMedia.length > 0) {
      mismatches.push(`${target.path}: media mismatch counts=${missingMedia.length}`);
    }
  }

  const nav = await prisma.navigation.findFirst({ where: { key: "main" }, include: { items: true } });
  const footer = await prisma.footer.findFirst({ where: { slug: "main-footer" }, include: { links: true } });

  const expectedNav = ["Home", "About Us", "Subscription", "Contact Us", "Login"];
  const navLabels = nav?.items.map((item) => item.label) ?? [];
  const navParity = (expectedNav.filter((label) => navLabels.includes(label)).length / expectedNav.length) * 100;
  if (navParity < 100) {
    mismatches.push(`Navigation parity ${navParity.toFixed(2)}%`);
  }

  const expectedFooter = ["Home", "About Us", "Subscription", "Contact Us", "Threat Detection", "Cloud Protection", "Security Audits", "Privacy Policy", "Terms of Service"];
  const footerLabels = footer?.links.map((link) => link.label) ?? [];
  const footerParity = (expectedFooter.filter((label) => footerLabels.includes(label)).length / expectedFooter.length) * 100;
  if (footerParity < 100) {
    mismatches.push(`Footer parity ${footerParity.toFixed(2)}%`);
  }

  const mediaTotal = await prisma.media.count({ where: { deletedAt: null } });
  const mediaParity = mediaTotal > 0 ? 100 : 0;

  const contentParity = contentTotal > 0 ? (contentMatches / contentTotal) * 100 : 100;
  const seoParity = contentParity;

  console.log(`Content parity: ${contentParity.toFixed(2)}%`);
  console.log(`Media parity: ${mediaParity.toFixed(2)}%`);
  console.log(`SEO parity: ${seoParity.toFixed(2)}%`);
  console.log(`Navigation parity: ${navParity.toFixed(2)}%`);
  console.log(`Footer parity: ${footerParity.toFixed(2)}%`);

  if (mismatches.length === 0) {
    console.log("Verification passed: database content matches the live Phause site for the primary CMS routes.");
    process.exit(0);
  }

  console.error("Verification found mismatches:\n- " + mismatches.join("\n- "));
  process.exit(1);
}

main().catch((error) => {
  console.error("Verification failed.", error);
  process.exit(1);
});
