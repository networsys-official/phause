import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { hasCmsRequestAccess, hasCmsRoleAccess, isAdminManagementPath, isPublicCmsReadRoute } from "@/lib/cms-access";

const localAuthSecret = "local-test-secret";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedCmsRoute = pathname.startsWith("/studio") || pathname.startsWith("/cms") || pathname.startsWith("/api/cms");

  if (!isProtectedCmsRoute) {
    return NextResponse.next();
  }

  if (isPublicCmsReadRoute(pathname, request.method)) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for authentication.");
  }

  

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? localAuthSecret,
  });

  if (!token && hasCmsRequestAccess(request.headers)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?reason=session_required", request.url));
  }

  const role = typeof token.role === "string" ? token.role : "VIEWER";

  if (isAdminManagementPath(pathname) && !hasCmsRoleAccess(pathname, role)) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/cms/:path*", "/studio/:path*", "/api/cms/:path*"],
};
