import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/cms-access", () => ({ hasCmsRequestAccess: () => true }));
vi.mock("@/features/cms/cms-revalidation", () => ({ revalidateCmsState: vi.fn() }));
vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    setting: { findFirst: mocks.findFirst, update: mocks.update },
    $transaction: mocks.transaction,
  },
}));

import { POST as saveSetting } from "@/app/api/cms/settings/route";

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/cms/settings", {
    method: "POST",
    headers: { host: "localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("settings route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.findFirst.mockReset();
    mocks.update.mockReset();
    mocks.auditCreate.mockReset();
    mocks.transaction.mockReset();
  });

  it("denies non-super-admin users", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "ADMIN" } });
    const response = await saveSetting(request({ id: "setting-1", key: "siteName", slug: "siteName", value: "New name", status: "DRAFT", version: 1 }));
    expect(response.status).toBe(403);
  });

  it("returns 401 without a session", async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await saveSetting(request({ id: "setting-1", key: "siteName", value: "New name", status: "DRAFT", version: 1 }));
    expect(response.status).toBe(401);
  });

  it("rejects stale setting versions", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "SUPER_ADMIN", email: "admin@example.com" } });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      setting: {
        findFirst: vi.fn().mockResolvedValue({ id: "setting-1", key: "siteName", slug: "siteName", value: "Old", status: "PUBLISHED", version: 2 }),
      },
      auditLog: { create: mocks.auditCreate },
    }));

    const response = await saveSetting(request({ id: "setting-1", key: "siteName", slug: "siteName", value: "New", status: "PUBLISHED", version: 1 }));
    expect(response.status).toBe(409);
  });

  it("creates a draft or published setting and audit entry", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "SUPER_ADMIN", email: "admin@example.com" } });
    const txSettingUpdate = vi.fn().mockResolvedValue({ id: "setting-1", key: "siteName", value: "New", status: "PUBLISHED", version: 3 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      setting: {
        findFirst: vi.fn().mockResolvedValue({ id: "setting-1", key: "siteName", slug: "siteName", value: "Old", status: "PUBLISHED", version: 2 }),
        update: txSettingUpdate,
      },
      auditLog: { create: mocks.auditCreate },
    }));

    const draft = await saveSetting(request({ id: "setting-1", key: "siteName", slug: "siteName", value: "New", status: "DRAFT", version: 2 }));
    expect(draft.status).toBe(200);
    expect(txSettingUpdate).toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entityType: "Setting", action: "UPDATE", settingId: "setting-1" }) }));

    mocks.auditCreate.mockClear();
    const publish = await saveSetting(request({ id: "setting-1", key: "siteName", slug: "siteName", value: "New", status: "PUBLISHED", version: 2 }));
    expect(publish.status).toBe(200);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "PUBLISH" }) }));
  });
});
