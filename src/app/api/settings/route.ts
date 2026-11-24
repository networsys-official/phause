import { NextResponse } from "next/server";

import { getPublishedSettings } from "@/features/cms/settings-public";

export async function GET() {
  try {
    const settings = await getPublishedSettings();
    return NextResponse.json({ success: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Settings unavailable." }, { status: 500 });
  }
}
