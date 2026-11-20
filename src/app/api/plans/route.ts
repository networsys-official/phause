import { NextResponse } from "next/server";
import { getAdminPlans } from "@/features/subscription/admin-plan-repository";

export async function GET() {
  try {
    return NextResponse.json(await getAdminPlans(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load admin subscription plans:", error);
    return NextResponse.json({ message: "The subscription plans service is unavailable." }, { status: 502 });
  }
}
