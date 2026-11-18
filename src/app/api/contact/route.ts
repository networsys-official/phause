import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(`public-contact:${clientIp}`, 5, 15 * 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many enquiries have been submitted. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Please submit a valid enquiry." },
      { status: 400 },
    );
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = clean(payload.name, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const company = clean(payload.company, 160);
  const subject = clean(payload.subject, 120) || "General enquiry";
  const message = clean(payload.message, 5000);

  if (name.length < 2) {
    return NextResponse.json({ success: false, message: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 20) {
    return NextResponse.json({ success: false, message: "Please provide a little more detail (at least 20 characters)." }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        slug: `website-enquiry-${randomUUID()}`,
        name,
        email,
        company: company || null,
        message: `Subject: ${subject}\n\n${message}`,
        source: "website-contact-form",
        status: "DRAFT",
      },
      select: { id: true },
    });

    return NextResponse.json(
      { success: true, reference: lead.id },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Public contact enquiry could not be saved", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "We couldn't save your enquiry just now. Please try again." },
      { status: 500 },
    );
  }
}
