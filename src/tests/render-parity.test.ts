import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { get } from "node:http";

import { chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
let localServer: ChildProcess | null = null;
let localServerExit: number | null = null;
let localServerSignal: NodeJS.Signals | null = null;
let localServerOutput = "";
let localPort = 0;
let localBase = "";

const LIVE_BASE = "https://phause.webandappdevelopmenttech.com";
const ROUTES = ["/", "/about", "/contact", "/subscription", "/registration"] as const;

async function getEphemeralPort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a local test port"));
        return;
      }
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function canReachLocalServer() {
  return new Promise<boolean>((resolve) => {
    const url = new URL(`${localBase}/api/health`);
    const request = get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          console.warn(`[render-parity] readiness HTTP ${response.statusCode}`);
          resolve(false);
          return;
        }

        try {
          const payload = JSON.parse(body) as { status?: string; service?: string };
          resolve(payload.status === "ok" && payload.service === "phause");
        } catch (error) {
          console.warn("[render-parity] readiness JSON failed", error instanceof Error ? error.message : String(error));
          resolve(false);
        }
      });
    });

    request.setTimeout(2_000, () => {
      request.destroy(new Error("readiness probe timed out"));
    });
    request.once("error", (error) => {
      console.warn("[render-parity] readiness probe failed", error.message);
      resolve(false);
    });
  });
}

function serverDiagnostics(reason: string) {
  return [
    reason,
    `server PID: ${localServer?.pid ?? "not spawned"}`,
    `server exit code: ${localServerExit ?? "still running"}`,
    `server signal: ${localServerSignal ?? "none"}`,
    `server stdout/stderr:\n${localServerOutput || "(empty)"}`,
  ].join("\n");
}

async function waitForLocalServer() {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    if (localServer?.exitCode !== null && localServer?.exitCode !== undefined) {
      throw new Error(serverDiagnostics(`Local server exited before readiness (attempt ${attempt})`));
    }

    console.info(`[render-parity] readiness attempt ${attempt}/60 at ${localBase}/api/health`);
    if (await canReachLocalServer()) {
      console.info(`[render-parity] server ready: PID ${localServer?.pid ?? "unknown"}, port ${localPort}`);
      return;
    }

    await delay(500);
  }

  throw new Error(serverDiagnostics("Local app did not become ready in time"));
}

async function stopLocalServer() {
  if (!localServer || localServer.killed) return;

  localServer.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => localServer?.once("exit", () => resolve())),
    delay(5_000),
  ]);

  if (localServer.exitCode === null && localServer.signalCode === null) {
    localServer.kill("SIGKILL");
  }
}

async function ensureLocalServer() {
  localPort = await getEphemeralPort();
  localBase = `http://127.0.0.1:${localPort}`;

  const productionBuildExists = existsSync(join(process.cwd(), ".next", "BUILD_ID"));
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const serverArgs = productionBuildExists
    ? [nextCli, "start", "-H", "127.0.0.1", "-p", String(localPort)]
    : [nextCli, "dev", "-H", "127.0.0.1", "-p", String(localPort)];

  localServerExit = null;
  localServerSignal = null;
  localServerOutput = "";

  localServer = spawn(process.execPath, serverArgs, {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(localPort) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const collectOutput = (chunk: Buffer) => {
    const text = chunk.toString();
    localServerOutput += text;
    process.stdout.write(`[render-parity:server] ${text}`);
  };
  localServer.stdout?.on("data", collectOutput);
  localServer.stderr?.on("data", collectOutput);
  localServer.once("exit", (code, signal) => {
    localServerExit = code;
    localServerSignal = signal;
    console.error(`[render-parity] server exited: PID ${localServer?.pid ?? "unknown"}, code ${code}, signal ${signal}`);
  });

  try {
    console.info(`[render-parity] spawning server PID ${localServer.pid ?? "unknown"} on ${localBase}, mode ${productionBuildExists ? "production" : "development"}`);
    await waitForLocalServer();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : serverDiagnostics("Local server failed"));
  }
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeList(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
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

  await stopLocalServer();
});

describe("render parity", () => {
  it("matches the live Phause site for the primary public routes", async () => {
    const mismatches: string[] = [];

    for (const route of ROUTES) {
      const localPage = await browser!.newPage();
      const livePage = await browser!.newPage();

      try {
        await localPage.goto(`${localBase}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
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
