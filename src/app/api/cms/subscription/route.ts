import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
}
