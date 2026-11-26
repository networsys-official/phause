import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import {
  buildPublicFormSubmissionSchema,
  parsePublicFormFields,
  valuesForLead,
} from "@/features/cms/public-form";

const submissionEnvelopeSchema = z.object({
  values: z.record(z.string(), z.unknown()),
  website: z.string().optional().default(""),
}).strict();

type SubmitParams = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: SubmitParams) {
  const { slug } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "global";
  const rateLimit = checkRateLimit(`public-form-submit:${slug}:${ip}`, 10, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Too many submissions. Please try again shortly." }, { status: 429 });
  }

  let form;
  try {
    form = await prisma.form.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
    });
  } catch {
    return NextResponse.json({ success: false, message: "The form is unavailable." }, { status: 503 });
  }

  if (!form) {
    return NextResponse.json({ success: false, message: "Form not found." }, { status: 404 });
  }

  let envelope: z.infer<typeof submissionEnvelopeSchema>;
  try {
    envelope = submissionEnvelopeSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ success: false, message: "Invalid submission payload." }, { status: 400 });
  }

  if (envelope.website.trim()) {
    return NextResponse.json({ success: true, message: "Thank you. Your submission was received." }, { status: 200 });
  }

  let fields;
  try {
    fields = parsePublicFormFields(form.fields);
  } catch {
    return NextResponse.json({ success: false, message: "The form configuration is invalid." }, { status: 400 });
  }

  let values: Record<string, unknown>;
  try {
    values = buildPublicFormSubmissionSchema(fields).parse(envelope.values);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: error.issues[0]?.message ?? "Please check the form fields and try again.",
        issues: error.issues,
      }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Invalid form values." }, { status: 400 });
  }

  const leadValues = valuesForLead(values);

  try {
    const lead = await prisma.lead.create({
      data: {
        slug: `${slug}-${randomUUID()}`,
        name: leadValues.name ?? null,
        email: leadValues.email ?? null,
        phone: leadValues.phone ?? null,
        company: leadValues.company ?? null,
        category: "General Enquiry",
        message: leadValues.message,
        source: `Form: ${form.name}`,
        status: "NEW",
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id, message: "Thank you. Your submission was received." }, { status: 201 });
  } catch (error) {
    logger.error("Public form submission failed", { error: error instanceof Error ? error.message : "Unknown database error", slug });
    return NextResponse.json({ success: false, message: "We could not save your submission. Please try again." }, { status: 500 });
  }
}
