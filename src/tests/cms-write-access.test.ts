import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/cms-access", () => ({ hasCmsRequestAccess: () => true }));

import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";

describe("shared CMS write access", () => {
  beforeEach(() => mocks.auth.mockReset());

  it("returns 401 without a session", async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await requireCmsWriteAccess(new NextRequest("http://localhost/api/cms/pages", { method: "POST" }));
    expect(response?.status).toBe(401);
  });

  it("returns 403 for a non-admin CMS role", async () => {
    mocks.auth.mockResolvedValue({ user: { role: "VIEWER" } });
    const response = await requireCmsWriteAccess(new NextRequest("http://localhost/api/cms/pages", { method: "PUT" }));
    expect(response?.status).toBe(403);
  });

  it("allows admin and editor roles", async () => {
    for (const role of ["ADMIN", "SUPER_ADMIN", "EDITOR", "AUTHOR"]) {
      mocks.auth.mockResolvedValue({ user: { role } });
      const response = await requireCmsWriteAccess(new NextRequest("http://localhost/api/cms/pages", { method: "POST" }));
      expect(response).toBeNull();
    }
  });
});
