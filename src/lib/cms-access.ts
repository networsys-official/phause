export type CmsRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "VIEWER";

export function isSuperAdminRole(role?: string | null): boolean {
  return role === "SUPER_ADMIN";
}

export function isAdminManagementPath(pathname: string): boolean {
  return pathname.startsWith("/cms/users") || pathname.startsWith("/cms/audit") || pathname.startsWith("/studio/users") || pathname.startsWith("/studio/audit") || pathname.startsWith("/api/cms/users") || pathname.startsWith("/api/cms/audit");
}

export function hasCmsRoleAccess(pathname: string, role?: string | null): boolean {
  const normalizedRole = (role ?? "VIEWER") as CmsRole;

  if (normalizedRole === "SUPER_ADMIN") {
    return true;
  }

  if (normalizedRole === "ADMIN") {
    return !isAdminManagementPath(pathname);
  }

  if (normalizedRole === "EDITOR") {
    return !isAdminManagementPath(pathname);
  }

  if (normalizedRole === "AUTHOR") {
    return !isAdminManagementPath(pathname);
  }

  return !isAdminManagementPath(pathname);
}

export function isPublicCmsReadRoute(pathname: string, method: string): boolean {
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  return pathname === "/api/cms/pages" || pathname === "/api/cms/blog" || pathname === "/api/cms/faqs" || pathname === "/api/cms/media";
}

export function canAccessCmsPage(sessionUser?: { role?: string | null } | null, hostname?: string | null): boolean {
  if (!sessionUser) {
    return isLocalCmsHost(hostname);
  }

  return hasCmsRoleAccess("/cms", sessionUser.role ?? null);
}

export function isLocalCmsHost(hostname: string | null | undefined): boolean {
  if (!hostname) {
    return false;
  }

  const normalized = hostname.replace(/\[::1\]/i, "::1").toLowerCase();
  return normalized === "localhost" || normalized.startsWith("localhost:") || normalized === "127.0.0.1" || normalized.startsWith("127.0.0.1:") || normalized === "::1" || normalized.startsWith("::1:");
}

export function hasCmsRequestAccess(headers: Headers | Record<string, string | undefined> | null | undefined): boolean {
  const headerRecord = headers instanceof Headers ? headers : new Headers(
    headers
      ? Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
          if (typeof value === "string") {
            acc[key] = value;
          }
          return acc;
        }, {})
      : undefined,
  );

  const cookieHeader = headerRecord.get("cookie") ?? "";
  const sessionCookie = /(?:__Secure-|__Host-)?next-auth\.session-token/i.test(cookieHeader);
  const host = headerRecord.get("host") ?? headerRecord.get("x-forwarded-host") ?? "";
  const configuredToken = process.env.CMS_PUBLIC_TOKEN;

  if (isLocalCmsHost(host) || sessionCookie) {
    return true;
  }

  if (!configuredToken) {
    return false;
  }

  const headerToken = headerRecord.get("x-cms-token") ?? "";
  return headerToken === configuredToken;
}
