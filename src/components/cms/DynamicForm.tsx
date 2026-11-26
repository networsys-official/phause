"use client";

import { useState } from "react";

import type { PublicFormField } from "@/features/cms/public-form";

export function DynamicForm({ slug, name = "", fields = [], submitLabel = "Submit" }: { slug: string; name?: string; fields?: PublicFormField[]; submitLabel?: string }) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(fields.map((field) => [field.key, field.type === "checkbox" ? false : ""])));
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const setField = (key: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = values[field.key];
      if (field.required) {
        if (field.type === "checkbox" && value !== true) nextErrors[field.key] = `${field.label} is required.`;
        if (field.type !== "checkbox" && (typeof value !== "string" || value.trim() === "")) nextErrors[field.key] = `${field.label} is required.`;
      }
      if (field.type === "email" && typeof value === "string" && value && !/^\S+@\S+\.\S+$/.test(value)) nextErrors[field.key] = "Enter a valid email address.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(slug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, website }),
      });
      const payload = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;
      if (!response.ok || payload?.success !== true) {
        setStatus("error");
        setMessage(payload?.message ?? "We could not submit the form. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(payload.message ?? "Thank you. Your submission was received.");
      setValues(Object.fromEntries(fields.map((field) => [field.key, field.type === "checkbox" ? false : ""])));
    } catch {
      setStatus("error");
      setMessage("We could not submit the form. Please try again.");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      {fields.map((field) => {
        const id = `form-${field.key}`;
        const error = errors[field.key];
        const common = {
          id,
          name: field.key,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : undefined,
          disabled: status === "sending",
          className: `w-full rounded-xl border ${error ? "border-rose-500/70" : "border-white/10"} bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-60`,
        };

        return (
          <div key={field.key}>
            {field.type === "checkbox" ? (
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input type="checkbox" checked={values[field.key] === true} onChange={(event) => setField(field.key, event.target.checked)} disabled={status === "sending"} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
                {field.label}{field.required ? <span aria-label="required"> *</span> : null}
              </label>
            ) : (
              <>
                <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-200">
                  {field.label}{field.required ? <span aria-label="required"> *</span> : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea {...common} rows={5} value={String(values[field.key] ?? "")} onChange={(event) => setField(field.key, event.target.value)} placeholder={field.placeholder} />
                ) : field.type === "select" ? (
                  <select {...common} value={String(values[field.key] ?? "")} onChange={(event) => setField(field.key, event.target.value)}>
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                    {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "radio" ? (
                  <div className="space-y-2" role="radiogroup" aria-label={field.label}>
                    {(field.options ?? []).map((option) => (
                      <label key={option} className="flex items-center gap-3 text-sm text-slate-300">
                        <input type="radio" name={field.key} value={option} checked={values[field.key] === option} onChange={(event) => setField(field.key, event.target.value)} disabled={status === "sending"} />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    {...common}
                    type={field.type === "email" ? "email" : field.type === "phone" || field.type === "tel" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={String(values[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </>
            )}
            {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-300">{error}</p> : null}
          </div>
        );
      })}

      {status === "success" ? <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {status === "error" ? <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{message}</div> : null}

      <button type="submit" disabled={status === "sending"} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
        {status === "sending" ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
