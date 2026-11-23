import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasCmsRequestAccess } from "@/lib/cms-access";

export async function requireCmsWriteAccess(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const role = String(session.user.role ?? "VIEWER");
  if (!["ADMIN", "SUPER_ADMIN", "EDITOR", "AUTHOR"].includes(role)) {
    return NextResponse.json({ success: false, message: "You do not have permission to change CMS content." }, { status: 403 });
  }
  if (!hasCmsRequestAccess(request.headers)) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  return null;
}
