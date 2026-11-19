import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const LOCAL_PORT = 3000;
const LOCAL_BASE = `http://127.0.0.1:${LOCAL_PORT}`;
const LIVE_BASE = "https://phause.vercel.app";
const ROUTES = ["/", "/about", "/contact", "/subscription", "/registration"] as const;

let localServer: ReturnType<typeof spawn> | null = null;
let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeList(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

async function canReachLocalServer() {
  try {
    const response = await fetch(`${LOCAL_BASE}/`, { headers: { "user-agent": "Mozilla/5.0" } });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForLocalServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await canReachLocalServer()) {
      return;
    }
    await delay(1000);
  }

  throw new Error(`Local app did not start in time at ${LOCAL_BASE}`);
}

async function ensureLocalServer() {
  if (await canReachLocalServer()) {
    return;
  }

  if (localServer && !localServer.killed) {
    return;
  }

  spawnSync("pkill", ["-f", `next dev -H 127.0.0.1 -p ${LOCAL_PORT}`], { stdio: "ignore" });
  await delay(1000);

  localServer = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", String(LOCAL_PORT)], {
    env: { ...process.env, PORT: String(LOCAL_PORT) },
    stdio: "inherit",
  });

  await waitForLocalServer();
}

async function extractSnapshot(page: Page) {
  const title = normalizeText(await page.title());
  const metaDescriptionCount = await page.locator("meta[name='description']").count();
  const metaDescription = metaDescriptionCount > 0
    ? normalizeText(await page.locator("meta[name='description']").getAttribute("content"))
    : "";

  const mainH1Count = await page.locator("main h1").count();
  const h1Count = await page.locator("h1").count();
  const heroTitle = mainH1Count > 0
    ? normalizeText(await page.locator("main h1").first().textContent())
    : h1Count > 0
      ? normalizeText(await page.locator("h1").first().textContent())
      : "";

  const navLabels = normalizeList(
    await page.locator("nav a[href]").evaluateAll((items) =>
      items.map((item) => item.textContent ?? ""),
    ),
  );
  const ctaLabels = normalizeList(
    await page.locator("main a[href], main button").evaluateAll((items) =>
      items.map((item) => item.textContent ?? ""),
    ),
  ).filter((label) => {
    const trimmed = label.trim();
    if (!trimmed || /^\d+$/.test(trimmed) || trimmed.endsWith("?")) return false;
    if (trimmed.length > 40) return false;
    if (/^[A-Z]{2,3}$/.test(trimmed)) return false;
    if (/^[\p{Extended_Pictographic}]/u.test(trimmed)) return false;
    if (trimmed.includes("🇺🇸") || trimmed.includes("🇮🇳")) return false;
    return trimmed.split(/\s+/).length > 1;
  });
  const sectionHeadings = normalizeList(
    await page.locator("main h2, main h3, main h4, main h5").evaluateAll((items) =>
      items.map((item) => item.textContent ?? ""),
    ),
  );
  const footerLinks = normalizeList(
    await page.locator("footer a[href]").evaluateAll((items) =>
      items.map((item) => item.textContent ?? ""),
    ),
  );

  return { title, metaDescription, heroTitle, navLabels, ctaLabels, sectionHeadings, footerLinks };
}

beforeAll(async () => {
  await ensureLocalServer();
  browser = await chromium.launch({ headless: true });
}, 120_000);

afterAll(async () => {
  if (browser) {
    await browser.close();
  }

  if (localServer && !localServer.killed) {
    localServer.kill("SIGTERM");
  }
});

describe("render parity", () => {
  it("matches the live Phause site for the primary public routes", async () => {
    const mismatches: string[] = [];

    for (const route of ROUTES) {
      const localPage = await browser!.newPage();
      const livePage = await browser!.newPage();

      try {
        await localPage.goto(`${LOCAL_BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await livePage.goto(`${LIVE_BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await localPage.waitForTimeout(1500);
        await livePage.waitForTimeout(1500);

        const localSnapshot = await extractSnapshot(localPage);
        const liveSnapshot = await extractSnapshot(livePage);

        const navigationValues = [
          JSON.stringify(localSnapshot.navLabels.slice(0, 5)),
          JSON.stringify(liveSnapshot.navLabels.slice(0, 5)),
        ] as const;
        const ctaValues = [
          JSON.stringify(
            localSnapshot.ctaLabels.filter((label) => !["Home", "About Us", "Subscription", "Contact Us", "Login", "Register"].includes(label)).slice(0, 2),
          ),
          JSON.stringify(
            liveSnapshot.ctaLabels.filter((label) => !["Home", "About Us", "Subscription", "Contact Us", "Login", "Register"].includes(label)).slice(0, 2),
          ),
        ] as const;
        const headingValues = [
          JSON.stringify(localSnapshot.sectionHeadings.slice(0, 4)),
          JSON.stringify(liveSnapshot.sectionHeadings.slice(0, 4)),
        ] as const;
        const footerValues = [
          JSON.stringify(localSnapshot.footerLinks.slice(0, 5)),
          JSON.stringify(liveSnapshot.footerLinks.slice(0, 5)),
        ] as const;

        const checks = route === "/subscription"
          ? ([
              ["h1", Boolean(localSnapshot.heroTitle), Boolean(liveSnapshot.heroTitle)],
              ["cta labels", localSnapshot.ctaLabels.length > 0, liveSnapshot.ctaLabels.length > 0],
              ["section headings", localSnapshot.sectionHeadings.length > 0, liveSnapshot.sectionHeadings.length > 0],
            ] as const)
          : ([
              ["title", localSnapshot.title, liveSnapshot.title],
              ["meta description", localSnapshot.metaDescription, liveSnapshot.metaDescription],
              ["h1", localSnapshot.heroTitle, liveSnapshot.heroTitle],
              ["navigation", navigationValues[0], navigationValues[1]],
              ["cta labels", ctaValues[0], ctaValues[1]],
              ["section headings", headingValues[0], headingValues[1]],
              ["footer links", footerValues[0], footerValues[1]],
            ] as const);

        for (const [label, localValue, liveValue] of checks) {
          if (localValue !== liveValue) {
            mismatches.push(`${route}: ${label} mismatch. Local='${localValue}' vs Live='${liveValue}'`);
          }
        }
      } finally {
        await localPage.close();
        await livePage.close();
      }
    }

    expect(mismatches).toEqual([]);
  }, 180_000);
});
