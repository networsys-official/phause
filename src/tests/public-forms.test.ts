import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPublicFormSubmissionSchema,
  parsePublicFormFields,
  valuesForLead,
} from "@/features/cms/public-form";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  leadCreate: vi.fn(),
  allowed: true,
}));

vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    form: { findFirst: mocks.findFirst },
    lead: { create: mocks.leadCreate },
  },
}));
vi.mock("@/shared/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: mocks.allowed, remaining: mocks.allowed ? 9 : 0 }),
}));

import { POST as submitForm } from "@/app/api/forms/[slug]/submit/route";

const fields = [
  { key: "name", label: "Name", type: "text" as const, placeholder: "", required: true, options: [] },
  { key: "email", label: "Email", type: "email" as const, placeholder: "", required: true, options: [] },
];

function request(body: unknown) {
  return new NextRequest("http://localhost/api/forms/kamal/submit", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify(body),
  });
}

describe("public form submissions", () => {
  beforeEach(() => {
    mocks.allowed = true;
    mocks.findFirst.mockReset();
    mocks.leadCreate.mockReset();
  });

  it("validates fields from the stored server definitions", () => {
    const parsedFields = parsePublicFormFields(fields);
    const schema = buildPublicFormSubmissionSchema(parsedFields);

    expect(schema.safeParse({ name: "Ada", email: "ada@example.com" }).success).toBe(true);
    expect(schema.safeParse({ name: "", email: "bad" }).success).toBe(false);
  });

  it("rejects unknown submitted fields", () => {
    const schema = buildPublicFormSubmissionSchema(parsePublicFormFields(fields));
    expect(schema.safeParse({ name: "Ada", email: "ada@example.com", injected: "no" }).success).toBe(false);
  });

  it("rejects unknown stored field types", () => {
    expect(() => parsePublicFormFields([
      { key: "password", label: "Password", type: "password", placeholder: "", required: true, options: [] },
    ])).toThrow();
  });

  it("returns 404 for missing or unpublished forms", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await submitForm(request({ values: {}, website: "" }), { params: Promise.resolve({ slug: "kamal" }) });
    expect(response.status).toBe(404);
  });

  it("returns 429 when submissions are rate limited", async () => {
    mocks.allowed = false;
    mocks.findFirst.mockResolvedValue({ id: "form-1", slug: "kamal", name: "Kamal", fields });
    const response = await submitForm(request({ values: { name: "Ada", email: "ada@example.com" }, website: "" }), { params: Promise.resolve({ slug: "kamal" }) });
    expect(response.status).toBe(429);
  });

  it("accepts honeypot submissions without creating a lead", async () => {
    mocks.findFirst.mockResolvedValue({ id: "form-1", slug: "kamal", name: "Kamal", fields });
    const response = await submitForm(request({ values: { name: "Ada", email: "ada@example.com" }, website: "spam.example" }), { params: Promise.resolve({ slug: "kamal" }) });
    expect(response.status).toBe(200);
    expect(mocks.leadCreate).not.toHaveBeenCalled();
  });

  it("creates a lead using server-loaded form fields", async () => {
    mocks.findFirst.mockResolvedValue({ id: "form-1", slug: "kamal", name: "Kamal", fields, status: "PUBLISHED" });
    mocks.leadCreate.mockResolvedValue({ id: "lead-1" });
    const response = await submitForm(request({ values: { name: "Ada", email: "ada@example.com" }, website: "" }), { params: Promise.resolve({ slug: "kamal" }) });
    expect(response.status).toBe(201);
    expect(mocks.leadCreate).toHaveBeenCalled();
    expect(valuesForLead({ name: "Ada", email: "ada@example.com" })).toMatchObject({ name: "Ada", email: "ada@example.com" });
  });
});
