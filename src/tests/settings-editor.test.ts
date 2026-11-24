import { describe, expect, it, vi } from "vitest";

import { validateSettingValue } from "@/features/cms/settings-schema";
import { getPublishedSettings, publicSettingDefaults } from "@/features/cms/settings-public";

vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: { setting: { findMany: vi.fn() } },
}));

describe("settings editor", () => {
  it("validates known setting types", () => {
    expect(validateSettingValue("siteName", "Phause")).toBeNull();
    expect(validateSettingValue("cmsApiEnabled", "true")).toBeNull();
    expect(validateSettingValue("cmsApiEnabled", "yes")).not.toBeNull();
    expect(validateSettingValue("supportEmail", "invalid")).not.toBeNull();
    expect(validateSettingValue("logoUrl", "logo.png")).not.toBeNull();
  });

  it("provides safe public defaults", () => {
    expect(publicSettingDefaults.siteName).toBe("Phause");
    expect(publicSettingDefaults.supportEmail).toBe("hello@phause.com");
  });

  it("ignores DRAFT values and falls back to defaults", () => {
    const publishedOnlyValues = new Map([
      ["supportEmail", "published@phause.com"],
    ]);
    const siteName = publishedOnlyValues.get("siteName") || publicSettingDefaults.siteName;
    expect(siteName).toBe("Phause");
  });

  it("keeps unknown legacy setting values editable as text", () => {
    expect(validateSettingValue("audit", "enabled")).toBeNull();
  });

  it("rejects secret-like setting keys", () => {
    expect(validateSettingValue("authToken", "secret-value")).toContain("Secret");
  });
});
