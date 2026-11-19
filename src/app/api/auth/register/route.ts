import { NextResponse } from "next/server";

const REGISTER_API_URL =
  "https://phishingsimulation.webandappdevelopmenttech.com/api/auth/register";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const payload = {
    ...body,
    email: String(body.email ?? "").trim().toLowerCase(),
    fullName: String(body.fullName ?? body.name ?? "").trim(),
  };

  try {
    const response = await fetch(REGISTER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const raw = data?.message;
      const message = Array.isArray(raw)
        ? raw.join(", ")
        : typeof raw === "string"
          ? raw
          : "Unable to create account right now.";
      return NextResponse.json(
        { success: false, message },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { success: true, ...(data ?? {}) },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Registration service is unavailable. Please try again." },
      { status: 502 },
    );
  }
}
