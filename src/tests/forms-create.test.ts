import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cmsFormCreateSchema } from "@/features/cms/form-schema";
import { generateFieldKey } from "@/components/cms/FormCreateEditor";

const mocks = vi.hoisted(() => ({
  role: "ADMIN",
  findUnique: vi.fn(),
  transaction: vi.fn(),
  create: vi.fn(),
  auditCreate: vi.fn(),
  revalidate: vi.fn(),
  push: vi.fn(),
  view: "view=create",
}));

vi.mock("@/auth", () => ({ auth: async () => ({ user: { role: mocks.role } }) }));
vi.mock("@/lib/cms-access", () => ({ hasCmsRequestAccess: () => true }));
vi.mock("@/shared/lib/rate-limit", () => ({ checkRateLimit: () => ({ allowed: true }) }));
vi.mock("@/features/cms/cms-revalidation", () => ({ revalidateCmsState: mocks.revalidate }));
vi.mock("@/infrastructure/database/prisma", () => ({
  prisma: {
    form: { findUnique: mocks.findUnique },
    $transaction: mocks.transaction,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.view),
}));

import { POST as createForm, getFormPlacementIndex } from "@/app/api/cms/forms/route";
import { FormsEditor } from "@/components/cms/content-editors";

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/cms/forms", {
    method: "POST",
    headers: { host: "localhost", "content-type": "application/json", cookie: "next-auth.session-token=test" },
    body: JSON.stringify(body),
  });
}

describe("Forms create flow", () => {
  beforeEach(() => {
    mocks.role = "ADMIN";
    mocks.view = "view=create";
    mocks.findUnique.mockReset();
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockReset();
    mocks.auditCreate.mockReset();
    mocks.revalidate.mockReset();
    mocks.push.mockReset();
    mocks.transaction.mockReset();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      form: { create: mocks.create },
      auditLog: { create: mocks.auditCreate },
    }));
  });

  it("validates fields, duplicate keys, unknown types, and publish requirements", () => {
    expect(cmsFormCreateSchema.safeParse({ name: "Contact", slug: "contact", status: "DRAFT", fields: [] }).success).toBe(true);

    expect(cmsFormCreateSchema.safeParse({
      name: "Contact",
      slug: "contact",
      status: "PUBLISHED",
      fields: [],
    }).success).toBe(false);

    expect(cmsFormCreateSchema.safeParse({
      name: "Contact",
      slug: "contact",
      status: "DRAFT",
      fields: [
        { key: "email", label: "Email", type: "email", placeholder: "", required: true, options: [] },
        { key: "email", label: "Email again", type: "text", placeholder: "", required: false, options: [] },
      ],
    }).success).toBe(false);

    expect(cmsFormCreateSchema.safeParse({
      name: "Contact",
      slug: "contact",
      status: "DRAFT",
      fields: [{ key: "password", label: "Password", type: "password", placeholder: "", required: true, options: [] }],
    }).success).toBe(false);
  });

  it("rejects duplicate slugs", async () => {
    mocks.findUnique.mockResolvedValue({ id: "existing" });
    const response = await createForm(request({ name: "Contact", slug: "contact", status: "DRAFT", fields: [] }));
    expect(response.status).toBe(409);
  });

  it("denies CMS write access for viewers", async () => {
    mocks.role = "VIEWER";
    const response = await createForm(request({ name: "Contact", slug: "contact", status: "DRAFT", fields: [] }));
    expect(response.status).toBe(403);
  });

  it("creates drafts and published forms differently", async () => {
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "form-1", ...data }));

    const draft = await createForm(request({ name: "Draft", slug: "draft", status: "DRAFT", fields: [] }));
    expect(draft.status).toBe(201);
    expect(mocks.auditCreate).toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();

    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "form-2", ...data }));
    const published = await createForm(request({
      name: "Published",
      slug: "published",
      status: "PUBLISHED",
      fields: [{ key: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true, options: [] }],
    }));
    expect(published.status).toBe(201);
    expect(mocks.revalidate).toHaveBeenCalledWith("published");
  });

  it("renders the create form for ?view=create", () => {
    render(React.createElement(FormsEditor, { forms: [] }));
    expect(screen.getByRole("heading", { name: "Create a form" })).toBeTruthy();
    expect(screen.getByLabelText(/Name/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
  });

  it("shows live public URL previews in the create screen", () => {
    render(React.createElement(FormsEditor, { forms: [] }));
    const name = screen.getByLabelText(/Name/);
    fireEvent.change(name, { target: { value: "Partner Enquiry" } });
    expect(screen.getByLabelText("Public URL preview").textContent).toContain("/forms/partner-enquiry");
  });

  it("shows published URLs, draft notes, Open and system usage labels", () => {
    mocks.view = "";
    render(React.createElement(FormsEditor, { forms: [
      { id: "1", name: "Contact form", slug: "contact-form", status: "PUBLISHED", fields: [], usedOn: ["/about", "/contact"] },
      { id: "2", name: "Internal draft", slug: "internal-draft", status: "DRAFT", fields: [] },
    ] }));

    expect(screen.getByText("/forms/contact-form")).toBeTruthy();
    expect(screen.getByText("Used on: /about, /contact")).toBeTruthy();
    expect(screen.getByText("Publish to get a public link")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open" }).getAttribute("href")).toBe("/forms/contact-form");
  });

  it("copies the public form URL", async () => {
    mocks.view = "";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(React.createElement(FormsEditor, { forms: [
      { id: "1", name: "Contact form", slug: "contact-form", status: "PUBLISHED", fields: [] },
    ] }));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("http://localhost:3000/forms/contact-form"));
  });

  it("generates field keys automatically", () => {
    expect(generateFieldKey("Email", [])).toBe("email");
    expect(generateFieldKey("Email", [{ label: "Email", key: "email", type: "text", placeholder: "", required: false, options: [] }])).toBe("email_2");
    expect(generateFieldKey("Password", [])).toBe("password");
  });

  it("calculates top, bottom and after-block placement indices", () => {
    const blocks = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(getFormPlacementIndex(blocks, "top")).toBe(0);
    expect(getFormPlacementIndex(blocks, "bottom")).toBe(3);
    expect(getFormPlacementIndex(blocks, "after", "b")).toBe(2);
  });

  it("auto-generates unique snake_case keys until a key is manually edited", () => {
    const fields = [{ label: "Full Name", key: "full_name", type: "text" as const, placeholder: "", required: false, options: [] }];
    expect(generateFieldKey("Full Name", fields)).toBe("full_name_2");
    expect(generateFieldKey("Email Address", fields)).toBe("email_address");
  });

  it("rejects placement on protected system pages", async () => {
    mocks.create.mockResolvedValue({ id: "form-3", slug: "protected-form", status: "PUBLISHED" });
    const response = await createForm(request({
      name: "Protected",
      slug: "protected-form",
      status: "PUBLISHED",
      fields: [{ key: "email", label: "Email", type: "email", placeholder: "", required: true, options: [] }],
      placement: { pageSlug: "about", pageVersion: 1, position: "bottom" },
    }));
    expect(response.status).toBe(400);
  });

  it("returns 409 when the selected page changed", async () => {
    mocks.create.mockResolvedValue({ id: "form-4", slug: "conflict-form", status: "PUBLISHED" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      form: { create: mocks.create },
      auditLog: { create: mocks.auditCreate },
      page: { findFirst: vi.fn().mockResolvedValue({ id: "page-1", slug: "custom-page", version: 2, blocks: [] }), update: vi.fn() },
      pageBlock: { update: vi.fn(), create: vi.fn() },
    }));
    const response = await createForm(request({
      name: "Conflict",
      slug: "conflict-form",
      status: "PUBLISHED",
      fields: [{ key: "email", label: "Email", type: "email", placeholder: "", required: true, options: [] }],
      placement: { pageSlug: "custom-page", pageVersion: 1, position: "bottom" },
    }));
    expect(response.status).toBe(409);
  });
});
