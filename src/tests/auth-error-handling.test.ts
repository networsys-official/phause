import { describe, expect, it } from "vitest";

import { canAccessCmsPage } from "@/lib/cms-access";
import { mapAuthError, normalizeAuthErrorKey } from "@/lib/auth-errors";

describe("Auth error handling", () => {
  it("maps credential, lock, disable, and service failures to user-safe messages", () => {
    expect(mapAuthError("Invalid credentials")).toBe("Invalid email or password.\n\nPlease check your credentials and try again.");
    expect(mapAuthError("CredentialsSignin")).toBe("Invalid email or password.\n\nPlease check your credentials and try again.");
    expect(mapAuthError("CallbackRouteError: Invalid credentials")).toBe("Invalid email or password.\n\nPlease check your credentials and try again.");
    expect(mapAuthError("Account locked")).toBe("Your account is temporarily locked.\n\nPlease try again later.");
    expect(mapAuthError("account_locked")).toBe("Your account is temporarily locked.\n\nPlease try again later.");
    expect(mapAuthError("CallbackRouteError: account_locked")).toBe("Your account is temporarily locked.\n\nPlease try again later.");
    expect(mapAuthError("CallbackRouteError: Account locked")).toBe("Your account is temporarily locked.\n\nPlease try again later.");
    expect(mapAuthError("Account disabled")).toBe("Your account has been disabled.\n\nPlease contact your administrator.");
    expect(mapAuthError("account_disabled")).toBe("Your account has been disabled.\n\nPlease contact your administrator.");
    expect(mapAuthError("Configuration")).toBe("Authentication service unavailable.\n\nPlease try again later.");
    expect(mapAuthError("AdapterError")).toBe("Authentication service unavailable.\n\nPlease try again later.");
    expect(mapAuthError("DatabaseError")).toBe("Authentication service unavailable.\n\nPlease try again later.");
  });

  it("keeps account lock and system failure mapping precise", () => {
    for (const value of [
      "account_locked",
      "Account locked",
      "CallbackRouteError: account_locked",
      "CallbackRouteError: Account locked",
    ]) {
      expect(normalizeAuthErrorKey(value)).toBe("account_locked");
      expect(normalizeAuthErrorKey(value)).not.toBe("service_unavailable");
      expect(mapAuthError(value)).toBe("Your account is temporarily locked.\n\nPlease try again later.");
    }

    for (const value of ["Configuration", "AdapterError", "DatabaseError"]) {
      expect(normalizeAuthErrorKey(value)).toBe("service_unavailable");
      expect(mapAuthError(value)).toBe("Authentication service unavailable.\n\nPlease try again later.");
    }
  });

  it("keeps non-auth redirect and access cases clear and specific", () => {
    expect(mapAuthError("SessionRequired")).toBe("Please sign in to continue.");
    expect(mapAuthError("session_required")).toBe("Please sign in to continue.");
    expect(mapAuthError("invalid_credentials")).toBe("Invalid email or password.\n\nPlease check your credentials and try again.");
    expect(mapAuthError("AccessDenied")).toBe("Access denied. Your account does not have permission to access this resource.");
  });

  it("allows CMS access on localhost without a signed-in session", () => {
    expect(canAccessCmsPage(null, "127.0.0.1:3000")).toBe(true);
    expect(canAccessCmsPage(null, "localhost:3000")).toBe(true);
    expect(canAccessCmsPage({ role: "VIEWER" }, "example.com")).toBe(true);
    expect(canAccessCmsPage(null, "example.com")).toBe(false);
  });
});
