import { z } from "zod";

export const formFieldTypes = [
  "text",
  "email",
  "phone",
  "tel",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "date",
] as const;

export const formFieldSchema = z.object({
  label: z.string().trim().min(1, "Field label is required."),
  key: z.string().trim().min(1, "Field key is required.").regex(/^[a-z][a-z0-9_]*$/, "Field keys must start with a letter and use snake_case (letters, numbers, and underscores only)."),
  type: z.enum(formFieldTypes),
  placeholder: z.string().default(""),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1, "Option cannot be empty.")).default([]),
}).superRefine((field, ctx) => {
  if ((field.type === "select" || field.type === "radio") && field.options.length === 0) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Select and radio fields require at least one option." });
  }
});

export const cmsFormPlacementSchema = z.object({
  pageSlug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  pageVersion: z.number().int().positive(),
  position: z.enum(["top", "bottom", "after"]),
  afterBlockId: z.string().optional(),
}).superRefine((placement, ctx) => {
  if (placement.position === "after" && !placement.afterBlockId) {
    ctx.addIssue({ code: "custom", path: ["afterBlockId"], message: "Choose a block to place the form after." });
  }
});

export const cmsFormCreateSchema = z.object({
  name: z.string().trim().min(1, "Form name is required."),
  slug: z.string().trim().min(1, "Form slug is required.").max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers, and hyphens."),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  fields: z.array(formFieldSchema).default([]),
  placement: cmsFormPlacementSchema.optional(),
}).superRefine((value, ctx) => {
  const keys = value.fields.map((field) => field.key.toLowerCase());
  const duplicates = new Set(keys.filter((key, index) => keys.indexOf(key) !== index));
  if (duplicates.size > 0) {
    ctx.addIssue({ code: "custom", path: ["fields"], message: `Field keys must be unique: ${[...duplicates].join(", ")}.` });
  }
  if (value.status === "PUBLISHED" && value.fields.length === 0) {
    ctx.addIssue({ code: "custom", path: ["fields"], message: "A published form must contain at least one field." });
  }
  if (value.status === "DRAFT" && value.placement) {
    ctx.addIssue({ code: "custom", path: ["placement"], message: "Placement is applied only when publishing." });
  }
});

export type CmsFormField = z.infer<typeof formFieldSchema>;
export type CmsFormCreateValue = z.infer<typeof cmsFormCreateSchema>;
