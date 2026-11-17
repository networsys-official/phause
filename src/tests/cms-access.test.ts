import { describe, expect, it } from "vitest";

import { hasCmsRoleAccess, isAdminManagementPath } from "@/lib/cms-access";

describe("CMS access control", () => {
  it("requires auth for admin-only management paths", () => {
    expect(isAdminManagementPath("/studio/users")).toBe(true);
    expect(isAdminManagementPath("/api/cms/audit")).toBe(true);
    expect(isAdminManagementPath("/studio/pages")).toBe(false);
  });

  it("blocks admin-only paths for non-admin roles", () => {
    expect(hasCmsRoleAccess("/studio/users", "EDITOR")).toBe(false);
    expect(hasCmsRoleAccess("/studio/users", "AUTHOR")).toBe(false);
    expect(hasCmsRoleAccess("/studio/users", "VIEWER")).toBe(false);
  });

  it("allows full access for super-admins and content access for editors", () => {
    expect(hasCmsRoleAccess("/studio/pages", "SUPER_ADMIN")).toBe(true);
    expect(hasCmsRoleAccess("/studio/pages", "EDITOR")).toBe(true);
    expect(hasCmsRoleAccess("/studio/users", "ADMIN")).toBe(false);
  });
});
