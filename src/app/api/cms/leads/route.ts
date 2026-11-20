import { NextRequest, NextResponse } from "next/server";

import { hasCmsRequestAccess } from "@/lib/cms-access";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

// 404 handler for removed CMS leads endpoints
export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
}
