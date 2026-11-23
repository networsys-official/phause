import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/infrastructure/database/prisma";

vi.mock("@/auth", () => ({ auth: async () => ({ user: { role: "ADMIN" } }) }));
vi.mock("@/lib/cms-access", () => ({ hasCmsRequestAccess: () => true }));

import { POST as createPage, PUT as updatePage, DELETE as deletePage, PATCH as patchPageBlock } from "@/app/api/cms/pages/route";
import { GET as getNavigation } from "@/app/api/navigation/route";
import { GET as getFooter } from "@/app/api/footer/route";

async function cmsRequest(handler: (request: NextRequest) => Promise<Response>, method: "POST" | "PUT" | "DELETE", body: Record<string, unknown>) {
  return handler(new NextRequest(`http://localhost/api/cms/pages`, {
    method,
    headers: { host: "localhost", "content-type": "application/json", cookie: "next-auth.session-token=test" },
    body: JSON.stringify(body),
  }));
}

async function patchRequest(body: Record<string, unknown>) {
  return patchPageBlock(new NextRequest("http://localhost/api/cms/pages", {
    method: "PATCH",
    headers: { host: "localhost", "content-type": "application/json", cookie: "next-auth.session-token=test" },
    body: JSON.stringify(body),
  }));
}

describe("page menu visibility integration", () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const slugs: string[] = [];

  beforeAll(async () => {
    await prisma.navigation.upsert({
      where: { key: "main" },
      update: {},
      create: { key: "main", slug: "main-navigation", label: "Main navigation", href: "/", status: "PUBLISHED", version: 1 },
    });
    await prisma.footer.upsert({
      where: { slug: "main-footer" },
      update: {},
      create: { slug: "main-footer", title: "Phause", status: "PUBLISHED", version: 1 },
    });
  });

  afterAll(async () => {
    for (const slug of slugs) {
      const page = await prisma.page.findUnique({ where: { slug } }).catch(() => null);
      if (page) {
        await prisma.navigationItem.updateMany({ where: { pageId: page.id }, data: { deletedAt: new Date() } });
        await prisma.footerLink.updateMany({ where: { pageId: page.id }, data: { deletedAt: new Date() } });
        await prisma.auditLog.deleteMany({ where: { pageId: page.id } }).catch(() => undefined);
        await prisma.pageBlock.deleteMany({ where: { pageId: page.id } }).catch(() => undefined);
        await prisma.page.delete({ where: { id: page.id } }).catch(() => undefined);
      }
    }
    await prisma.$disconnect();
  });

  it("creates published pages in both menus and removes them on delete", async () => {
    const slug = `test-page-${suffix}`;
    slugs.push(slug);
    const created = await cmsRequest(createPage, "POST", {
      title: "Test Page",
      slug,
      status: "PUBLISHED",
      showInHeader: true,
      headerLabel: "Test menu",
      headerPosition: 90,
      showInFooter: true,
      footerGroup: "SERVICES",
      footerLabel: "Test footer",
      footerPosition: 90,
    });
    expect(created.status).toBe(201);

    const navigation = await (await getNavigation()).json() as { navigation: { items: Array<{ href: string; label: string }> } };
    expect(navigation.navigation.items).toContainEqual(expect.objectContaining({ href: `/${slug}`, label: "Test menu" }));

    const footer = await (await getFooter()).json() as { footer: { links: Array<{ href: string; label: string; type: string }> } };
    expect(footer.footer.links).toContainEqual(expect.objectContaining({ href: `/${slug}`, label: "Test footer", type: "SERVICES" }));

    const deleted = await cmsRequest(deletePage, "DELETE", { slug });
    expect(deleted.status).toBe(200);
  });

  it("rejects duplicate and reserved slugs", async () => {
    const slug = `reserved-duplicate-${suffix}`;
    slugs.push(slug);
    const first = await cmsRequest(createPage, "POST", { title: "One", slug, status: "DRAFT", blocks: [] });
    expect(first.status).toBe(201);

    const duplicate = await cmsRequest(createPage, "POST", { title: "Two", slug, status: "DRAFT", blocks: [] });
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).message).toContain("already exists");

    const reserved = await cmsRequest(createPage, "POST", { title: "Reserved", slug: "api", status: "DRAFT", blocks: [] });
    expect(reserved.status).toBe(400);
    expect((await reserved.json()).message).toContain("reserved");
  });

  it("updates slug and status visibility at read time", async () => {
    const oldSlug = `status-menu-${suffix}`;
    const newSlug = `status-menu-renamed-${suffix}`;
    slugs.push(oldSlug, newSlug);

    const created = await cmsRequest(createPage, "POST", { title: "Status page", slug: oldSlug, status: "DRAFT", showInHeader: true, blocks: [] });
    expect(created.status).toBe(201);
    const createdPage = await (created.json()) as { page: { id: string; version: number } };

    const draftNav = await (await getNavigation()).json() as { navigation: { items: Array<{ href: string }> } };
    expect(draftNav.navigation.items.some((item) => item.href === `/${oldSlug}`)).toBe(false);

    const published = await cmsRequest(updatePage, "PUT", { id: createdPage.page.id, slug: oldSlug, title: "Status page", status: "PUBLISHED", version: createdPage.page.version, showInHeader: true, headerPosition: 91, blocks: [] });
    expect(published.status).toBe(200);
    const publishedPage = await published.json() as { page: { id: string; version: number } };

    const renamed = await cmsRequest(updatePage, "PUT", { id: publishedPage.page.id, slug: newSlug, title: "Status page", status: "PUBLISHED", version: publishedPage.page.version, showInHeader: true, headerPosition: 91, blocks: [] });
    expect(renamed.status).toBe(200);

    const nav = await (await getNavigation()).json() as { navigation: { items: Array<{ href: string }> } };
    expect(nav.navigation.items.some((item) => item.href === `/${newSlug}`)).toBe(true);
    expect(nav.navigation.items.some((item) => item.href === `/${oldSlug}`)).toBe(false);

    const stale = await cmsRequest(updatePage, "PUT", { id: publishedPage.page.id, slug: newSlug, title: "Status page", status: "PUBLISHED", version: publishedPage.page.version, showInHeader: true, blocks: [] });
    expect(stale.status).toBe(409);
  });

  it("updates existing home page hero while keeping its system slug", async () => {
    const home = await prisma.page.findFirst({
      where: { slug: "home", deletedAt: null },
      include: { blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
    });
    expect(home).not.toBeNull();

    const hero = home!.blocks.find((block) => String(block.type).toUpperCase() === "HERO");
    expect(hero).toBeDefined();

    const originalProps = hero!.props as Record<string, unknown>;
    const originalTitle = typeof originalProps.title === "string" ? originalProps.title : "";
    const editedTitle = `${originalTitle} — CMS regression`;

    const updated = await cmsRequest(updatePage, "PUT", {
      id: home!.id,
      slug: "home",
      title: home!.title,
      status: home!.status,
      version: home!.version,
      showInHeader: true,
      showInFooter: false,
      blocks: home!.blocks.map((block) => ({
        id: block.id,
        type: String(block.type).toLowerCase(),
        order: block.order,
        props: block.id === hero!.id
          ? { ...(block.props as Record<string, unknown>), title: editedTitle }
          : (block.props as Record<string, unknown>),
      })),
    });

    expect(updated.status).toBe(200);

    const persisted = await prisma.pageBlock.findUnique({ where: { id: hero!.id } });
    expect(persisted?.props).toMatchObject({ title: editedTitle });

    await cmsRequest(updatePage, "PUT", {
      id: home!.id,
      slug: "home",
      title: home!.title,
      status: home!.status,
      version: (await updated.json()).page.version,
      showInHeader: true,
      showInFooter: false,
      blocks: home!.blocks.map((block) => ({
        id: block.id,
        type: String(block.type).toLowerCase(),
        order: block.order,
        props: block.id === hero!.id
          ? { ...(block.props as Record<string, unknown>), title: originalTitle }
          : (block.props as Record<string, unknown>),
      })),
    });
  });

  it("patches one block field without changing the others and clears values", async () => {
    const slug = `patch-page-${suffix}`;
    slugs.push(slug);
    const created = await cmsRequest(createPage, "POST", { title: "Patch page", slug, status: "PUBLISHED", blocks: [{ type: "hero", props: { title: "Original", description: "Untouched", buttonLink: "/services" } }] });
    expect(created.status).toBe(201);
    const createdBody = await created.json() as { page: { id: string; blocks: Array<{ id: string; version: number }> } };
    const block = createdBody.page.blocks[0];

    const first = await patchRequest({ pageId: createdBody.page.id, blockId: block.id, fieldPath: "title", value: "Changed", version: block.version });
    expect(first.status).toBe(200);

    const title = await prisma.pageBlock.findUnique({ where: { id: block.id } });
    expect(title?.props).toMatchObject({ title: "Changed", description: "Untouched", buttonLink: "/services" });

    const updatedVersion = (await prisma.pageBlock.findUnique({ where: { id: block.id } }))?.version ?? 1;
    const second = await patchRequest({ pageId: createdBody.page.id, blockId: block.id, fieldPath: "description", value: "Second field", version: updatedVersion });
    expect(second.status).toBe(200);

    const clearedVersion = (await prisma.pageBlock.findUnique({ where: { id: block.id } }))?.version ?? 1;
    const cleared = await patchRequest({ pageId: createdBody.page.id, blockId: block.id, fieldPath: "title", value: "", version: clearedVersion });
    expect(cleared.status).toBe(200);

    const stale = await patchRequest({ pageId: createdBody.page.id, blockId: block.id, fieldPath: "description", value: "Stale", version: 1 });
    expect(stale.status).toBe(409);

    const persisted = await prisma.pageBlock.findUnique({ where: { id: block.id } });
    expect(persisted?.props).toMatchObject({ title: "", description: "Second field", buttonLink: "/services" });
  });

  it("protects system pages and reserved slugs", async () => {
    const home = await prisma.page.findUnique({ where: { slug: "home" } });
    expect(home).not.toBeNull();

    const changedSlug = await cmsRequest(updatePage, "PUT", { id: home!.id, slug: "renamed-home", title: home!.title, status: home!.status, version: home!.version, blocks: [] });
    expect(changedSlug.status).toBe(400);

    const deleted = await cmsRequest(deletePage, "DELETE", { slug: "home" });
    expect(deleted.status).toBe(403);

    const reserved = await cmsRequest(createPage, "POST", { title: "Reserved", slug: "cms", status: "DRAFT", blocks: [] });
    expect(reserved.status).toBe(400);
  });

  it("returns exactly one Home item at the root href", async () => {
    const navigation = await (await getNavigation()).json() as { navigation: { items: Array<{ href: string; label: string }> } };
    const homeItems = navigation.navigation.items.filter((item) => item.label === "Home" || item.href === "/");
    expect(homeItems).toHaveLength(1);
    expect(homeItems[0]).toEqual(expect.objectContaining({ href: "/", label: "Home" }));
  });

  it("edits page-level title without changing existing block data", async () => {
    const slug = `three-block-edit-${suffix}`;
    slugs.push(slug);
    const created = await cmsRequest(createPage, "POST", {
      title: "Three block page",
      slug,
      status: "PUBLISHED",
      blocks: [
        { type: "hero", order: 0, props: { title: "Hero stays", subtitle: "Hero subtitle" } },
        { type: "richText", order: 1, props: { title: "Text stays", description: "Text description" } },
        { type: "cta", order: 2, props: { title: "CTA stays", buttonText: "Continue" } },
      ],
    });
    expect(created.status).toBe(201);
    const createdPage = await created.json() as { page: { id: string; version: number } };
    const before = await prisma.pageBlock.findMany({ where: { pageId: createdPage.page.id, deletedAt: null }, orderBy: { order: "asc" } });
    expect(before).toHaveLength(3);

    const updated = await cmsRequest(updatePage, "PUT", {
      id: createdPage.page.id,
      slug,
      title: "Renamed three block page",
      status: "PUBLISHED",
      version: createdPage.page.version,
      starter: "BLANK",
      blocks: [],
    });
    expect(updated.status).toBe(200);

    const after = await prisma.pageBlock.findMany({ where: { pageId: createdPage.page.id, deletedAt: null }, orderBy: { order: "asc" } });
    expect(after.map((block) => block.type)).toEqual(before.map((block) => block.type));
    expect(after.map((block) => block.props)).toEqual(before.map((block) => block.props));
  });
});
