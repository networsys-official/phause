import { NextResponse } from "next/server";

const RESEND_OTP_API_URL =
  "https://phishingsimulation.webandappdevelopmenttech.com/api/auth/resend-otp";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload?.email) {
    return NextResponse.json(
      { message: "Email address is required." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(RESEND_OTP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? { message: "Unable to resend OTP." },
        { status: response.status }
      );
    }

    return NextResponse.json(
      data ?? { success: true },
      { status: response.status }
    );
  } catch {
    return NextResponse.json(
      { message: "OTP service is currently unavailable." },
      { status: 502 }
    );
  }
}