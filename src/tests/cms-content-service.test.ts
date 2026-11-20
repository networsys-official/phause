import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();
const deleteManyMock = vi.fn();
const createManyMock = vi.fn();
const countMock = vi.fn();

vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<void>) => callback({
      media: { count: countMock, deleteMany: deleteManyMock, upsert: upsertMock },
      page: {
        count: countMock,
        upsert: upsertMock,
        update: vi.fn(),
        deleteMany: deleteManyMock,
      },
      seo: { upsert: upsertMock },
      navigation: { upsert: upsertMock },
      navigationItem: { deleteMany: deleteManyMock, createMany: createManyMock },
      footer: { upsert: upsertMock },
      footerLink: { deleteMany: deleteManyMock, createMany: createManyMock },
      pageBlock: { deleteMany: deleteManyMock, createMany: createManyMock },
    } as Record<string, unknown>),
  },
}));

import { hasDefaultCmsContent } from "@/features/cms/content-service";

describe("cms content service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not overwrite existing CMS content when records already exist", async () => {
    countMock.mockResolvedValue(5);

    await hasDefaultCmsContent();

    expect(upsertMock).not.toHaveBeenCalled();
    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();
  });
});
