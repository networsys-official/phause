import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const LEAD_CATEGORIES = [
  "General Enquiry",
  "Platform Demo Request",
  "Pricing & Subscription",
  "Incident / Emergency Support",
  "Partnership Opportunity",
] as const;

const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  subject: z.enum(LEAD_CATEGORIES).optional().default("General Enquiry"),
  message: z.string().trim().min(20).max(5000),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "global";
  const rateLimit = checkRateLimit(`contact-submit:${ip}`, 10, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Too many enquiries. Please try again shortly." }, { status: 429 });
  }

  let payload: z.infer<typeof contactSubmissionSchema>;

  try {
    payload = contactSubmissionSchema.parse(await request.json());
  } catch (error) {
    logger.warn("CONTACT_SUBMIT_VALIDATION_ERROR", {
      error: error instanceof Error ? error.message : "Invalid payload",
    });
    return NextResponse.json({ success: false, message: "Please check the enquiry details and try again." }, { status: 400 });
  }

  console.info("CONTACT_SUBMIT_START", {
    email: payload.email,
    subject: payload.subject,
  });

  try {
    const lead = await prisma.lead.create({
      data: {
        slug: `contact-${randomUUID()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company,
        category: payload.subject,
        message: payload.message,
        source: "Contact Us",
        status: "NEW",
      },
    });

    console.info("CONTACT_SUBMIT_DB_WRITE", { leadId: lead.id, slug: lead.slug });
    console.info("CONTACT_SUBMIT_SUCCESS", { leadId: lead.id });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: "Enquiry received.",
    }, { status: 201 });
  } catch (error) {
    console.error("CONTACT_SUBMIT_DB_ERROR", error instanceof Error ? error.message : String(error));
    logger.error("Contact enquiry persistence failed", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    return NextResponse.json({
      success: false,
      message: "We could not save your enquiry. Please try again.",
    }, { status: 500 });
  }
}
