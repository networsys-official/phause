import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/database/prisma";
import { applyContentPatches } from "@/features/cms/content-patches";

describe("content patch runner", () => {
  beforeAll(async () => {
    await prisma.page.upsert({ where: { slug: "patch-default" }, update: {}, create: { slug: "patch-default", title: "Patch default", status: "PUBLISHED", version: 1 } });
    await prisma.page.upsert({ where: { slug: "patch-edited" }, update: {}, create: { slug: "patch-edited", title: "Patch edited", status: "PUBLISHED", version: 1 } });

    const defaultPage = await prisma.page.findUnique({ where: { slug: "patch-default" } });
    const editedPage = await prisma.page.findUnique({ where: { slug: "patch-edited" } });

    await prisma.pageBlock.create({ data: { pageId: defaultPage!.id, type: "HERO", order: 0, props: { title: "Strengthen. Aware.Defend." }, version: 1 } });
    await prisma.pageBlock.create({ data: { pageId: editedPage!.id, type: "HERO", order: 0, props: { title: "My custom hero" }, version: 1 } });
  });

  afterAll(async () => {
    await prisma.pageBlock.deleteMany({ where: { page: { slug: { in: ["patch-default", "patch-edited"] } } } });
    await prisma.page.deleteMany({ where: { slug: { in: ["patch-default", "patch-edited"] } } });
    await prisma.$disconnect();
  });

  it("never overwrites CMS content and is safe to apply twice", async () => {
    await applyContentPatches();

    const defaultPage = await prisma.page.findUnique({ where: { slug: "patch-default" }, include: { blocks: true } });
    const editedPage = await prisma.page.findUnique({ where: { slug: "patch-edited" }, include: { blocks: true } });

    expect(defaultPage?.blocks[0]?.props).toEqual({ title: "Strengthen. Aware.Defend." });
    expect(editedPage?.blocks[0]?.props).toEqual({ title: "My custom hero" });

    await applyContentPatches();

    const defaultAfterSecondRun = await prisma.page.findUnique({ where: { slug: "patch-default" }, include: { blocks: true } });
    const editedAfterSecondRun = await prisma.page.findUnique({ where: { slug: "patch-edited" }, include: { blocks: true } });

    expect(defaultAfterSecondRun?.blocks[0]?.props).toEqual({ title: "Strengthen. Aware.Defend." });
    expect(editedAfterSecondRun?.blocks[0]?.props).toEqual({ title: "My custom hero" });
  });
});
