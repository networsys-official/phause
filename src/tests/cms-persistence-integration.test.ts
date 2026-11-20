import { NextRequest } from "next/server";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import type { CmsSaveResponse } from "@/features/cms/cms-page-contract";
import { prisma } from "@/infrastructure/database/prisma";

vi.mock("@/lib/cms-access", () => ({ hasCmsRequestAccess: () => true }));
import { PUT as saveCmsPage, GET as loadCmsPage } from "@/app/api/cms/pages/route";
import { GET as loadPublicPage } from "@/app/api/pages/route";

const editedTitle = `Strengthen. Aware. Defend. persisted ${Date.now()}`;

async function cmsRequest(method: "PUT" | "GET", url: string, body?: Record<string, unknown>) {
  const request = new NextRequest(url, {
    method,
    headers: { host: "localhost", "content-type": "application/json", cookie: "next-auth.session-token=test", "x-cms-token": "integration-test-token" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return method === "PUT" ? saveCmsPage(request) : loadCmsPage(request);
}

async function heroTitleFromCms() {
  const response = await cmsRequest("GET", "http://localhost/api/cms/pages?slug=home");
  const payload = await response.json() as { page?: { blocks?: Array<{ type: string; props?: Record<string, unknown> }> } };
  const hero = payload.page?.blocks?.find((block) => String(block.type).toLowerCase() === "hero");
  return String(hero?.props?.title ?? "");
}

async function heroTitleFromPublicApi() {
  const response = await loadPublicPage(new NextRequest("http://localhost/api/pages?slug=home", { headers: { host: "localhost" } }));
  const payload = await response.json() as { page?: { blocks?: Array<{ type: string; props?: Record<string, unknown> }> } };
  const hero = payload.page?.blocks?.find((block) => String(block.type).toLowerCase() === "hero");
  return String(hero?.props?.title ?? "");
}

describe("CMS hero persistence integration", () => {
  const testSlug = `cms-persistence-${process.pid}-${Date.now()}`;
  let testPageId = "";

  beforeAll(async () => {
    const page = await prisma.page.create({
      data: {
        slug: testSlug,
        title: "CMS persistence test",
        status: "PUBLISHED",
        version: 1,
        blocks: {
          create: [{
            type: "HERO",
            order: 0,
            props: { title: "Initial title", subtitle: "Initial subtitle", visibility: true },
            version: 1,
          }],
        },
      },
      include: { blocks: true },
    });
    testPageId = page.id;
  });

  afterAll(async () => {
    if (testPageId) {
      await prisma.auditLog.deleteMany({ where: { pageId: testPageId } }).catch(() => undefined);
      await prisma.pageBlock.deleteMany({ where: { pageId: testPageId } }).catch(() => undefined);
      await prisma.page.delete({ where: { id: testPageId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("saves twice, rejects stale versions, and preserves unchanged saves", async () => {
    const loaded = await cmsRequest("GET", `http://localhost/api/cms/pages?slug=${testSlug}`);
    const loadedPayload = await loaded.json() as { page: { id: string; slug: string; title: string; status: string; version: number; seo?: { title?: string | null; description?: string | null; keywords?: string | null; canonical?: string | null }; blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }> } };
    expect(loaded.status).toBe(200);

    const firstBlocks = loadedPayload.page.blocks.map((block) => ({
      ...block,
      props: block.type === "HERO" ? { ...block.props, title: "Second save title one" } : block.props,
    }));

    const firstSave = await cmsRequest("PUT", "http://localhost/api/cms/pages", {
      id: loadedPayload.page.id,
      slug: loadedPayload.page.slug,
      title: loadedPayload.page.title,
      status: loadedPayload.page.status,
      version: loadedPayload.page.version,
      seo: loadedPayload.page.seo,
      blocks: firstBlocks,
    });
    expect(firstSave.status).toBe(200);
    const firstPayload = await firstSave.json() as { page: { id: string; slug: string; title: string; status: string; version: number; seo?: { title?: string | null; description?: string | null; keywords?: string | null; canonical?: string | null }; blocks: Array<{ id: string; type: string; order: number; props: Record<string, unknown> }> } };

    const secondBlocks = firstPayload.page.blocks.map((block) => ({
      ...block,
      props: block.type === "HERO" ? { ...block.props, title: "Second save title two" } : block.props,
    }));

    const secondSave = await cmsRequest("PUT", "http://localhost/api/cms/pages", {
      id: firstPayload.page.id,
      slug: firstPayload.page.slug,
      title: firstPayload.page.title,
      status: firstPayload.page.status,
      version: firstPayload.page.version,
      seo: firstPayload.page.seo,
      blocks: secondBlocks,
    });
    expect(secondSave.status).toBe(200);

    const persistedBody = await secondSave.json() as unknown;
    console.log("SECOND_SAVE_RESPONSE", JSON.stringify({ status: secondSave.status, body: persistedBody }, null, 2));
    const persisted = persistedBody as CmsSaveResponse;
    expect(persisted.page.blocks.find((block) => block.type === "HERO")?.props.title).toBe("Second save title two");

    const staleSave = await cmsRequest("PUT", "http://localhost/api/cms/pages", {
      id: firstPayload.page.id,
      slug: firstPayload.page.slug,
      title: firstPayload.page.title,
      status: firstPayload.page.status,
      version: firstPayload.page.version,
      seo: firstPayload.page.seo,
      blocks: secondBlocks,
    });
    expect(staleSave.status).toBe(409);
    const staleBody = await staleSave.json() as { code?: string; message?: string };
    expect(staleBody.code).toBe("VERSION_CONFLICT");
    expect(staleBody.message).toContain("another tab");

    const unchangedSave = await cmsRequest("PUT", "http://localhost/api/cms/pages", {
      id: firstPayload.page.id,
      slug: firstPayload.page.slug,
      title: firstPayload.page.title,
      status: firstPayload.page.status,
      version: persisted.page.version,
      seo: firstPayload.page.seo,
      blocks: persisted.page.blocks,
    });
    expect(unchangedSave.status).toBe(200);
  });
});
