import { z } from "zod";

export const publicFormFieldTypes = ["text", "email", "phone", "tel", "textarea", "select", "radio", "checkbox", "number", "date"] as const;

export type PublicFormField = {
  key: string;
  label: string;
  type: (typeof publicFormFieldTypes)[number];
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export const publicFormFieldSchema = z.object({
  key: z.string().trim().min(1).regex(/^[a-z][a-z0-9_]*$/i),
  label: z.string().trim().min(1),
  type: z.enum(publicFormFieldTypes),
  placeholder: z.string().default(""),
  required: z.boolean().optional().default(false),
  options: z.array(z.string().trim().min(1)).optional().default([]),
}).superRefine((field, ctx) => {
  if ((field.type === "select" || field.type === "radio") && (!field.options || field.options.length === 0)) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Select and radio fields require options." });
  }
});

export const publicFormFieldsSchema = z.array(publicFormFieldSchema).superRefine((fields, ctx) => {
  const keys = fields.map((field) => field.key.toLowerCase());
  const duplicates = new Set(keys.filter((key, index) => keys.indexOf(key) !== index));
  if (duplicates.size > 0) {
    ctx.addIssue({ code: "custom", message: `Duplicate field keys: ${[...duplicates].join(", ")}.` });
  }
});

export function parsePublicFormFields(value: unknown): PublicFormField[] {
  return publicFormFieldsSchema.parse(value);
}

export function buildPublicFormSubmissionSchema(fields: PublicFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    if (field.type === "email") {
      fieldSchema = z.string().trim().email("Enter a valid email address.").max(254);
    } else if (field.type === "phone" || field.type === "tel") {
      fieldSchema = z.string().trim().max(40);
    } else if (field.type === "textarea") {
      fieldSchema = z.string().trim().max(5000);
    } else if (field.type === "number") {
      fieldSchema = z.preprocess((value) => {
        if (typeof value === "string" && value.trim() !== "") return Number(value);
        return value;
      }, z.number().finite());
    } else if (field.type === "date") {
      fieldSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");
    } else if (field.type === "select" || field.type === "radio") {
      fieldSchema = z.enum(field.options as [string, ...string[]]);
    } else if (field.type === "checkbox") {
      fieldSchema = z.boolean();
    } else {
      fieldSchema = z.string().trim().max(500);
    }

    if (!field.required) {
      if (field.type === "checkbox") fieldSchema = fieldSchema.optional().default(false);
      else if (field.type === "number") fieldSchema = fieldSchema.optional();
      else fieldSchema = z.union([fieldSchema, z.literal("")]).optional().default("");
    }

    shape[field.key] = fieldSchema;
  }

  return z.object(shape).strict();
}

export function valuesForLead(values: Record<string, unknown>) {
  const first = (keys: string[]) => keys.map((key) => values[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined;
  const name = first(["name", "fullName", "full_name"]);
  const email = first(["email", "workEmail", "work_email"]);
  const phone = first(["phone", "tel", "phoneNumber", "phone_number"]);
  const company = first(["company", "organisationName", "organizationName", "organisation_name", "organization_name"]);
  const directMessage = first(["message", "messageText", "enquiry", "comments"]);

  return {
    name,
    email,
    phone,
    company,
    message: directMessage ?? JSON.stringify(values),
  };
}
