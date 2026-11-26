export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DynamicForm } from "@/components/cms/DynamicForm";
import { parsePublicFormFields, type PublicFormField } from "@/features/cms/public-form";
import { prisma } from "@/infrastructure/database/prisma";

type PublicFormParams = { params: Promise<{ slug: string }> };

async function loadPublishedForm(slug: string) {
  try {
    return await prisma.form.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PublicFormParams): Promise<Metadata> {
  const { slug } = await params;
  const form = await loadPublishedForm(slug);
  return form
    ? { title: form.name, description: `Submit ${form.name}.` }
    : { title: "Form not found" };
}

export default async function PublicFormPage({ params }: PublicFormParams) {
  const { slug } = await params;
  const form = await loadPublishedForm(slug);
  if (!form) notFound();

  let fields: PublicFormField[];
  try {
    fields = parsePublicFormFields(form.fields);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16 sm:px-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-white">{form.name}</h1>
        <div className="mt-7">
          <DynamicForm slug={form.slug} name={form.name} fields={fields} />
        </div>
      </div>
    </main>
  );
}
