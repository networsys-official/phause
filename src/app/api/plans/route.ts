import { NextResponse } from "next/server";
import { fetchPublicPlans } from "@/features/subscription/public-plans";

export async function GET() {
  try {
    const plans = await fetchPublicPlans();
    return NextResponse.json({ success: true, plans }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "[plans] unable to load plans",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { success: false, message: "Unable to load subscription plans." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
