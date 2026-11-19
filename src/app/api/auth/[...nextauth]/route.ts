import type { NextRequest } from "next/server";
import { assertRuntimeAuthSecret, handlers } from "@/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  assertRuntimeAuthSecret();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  assertRuntimeAuthSecret();
  return handlers.POST(request);
}
