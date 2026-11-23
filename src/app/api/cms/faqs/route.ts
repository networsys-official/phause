import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { prisma } from "@/infrastructure/database/prisma";

const DEFAULT_FAQS = [
	{
		slug: "faq-verify-1793703803798",
		question: "FAQ verify 1793703803798",
		answer: "FAQ answer body",
	},
	{
		slug: "faq-verify-1793703703617",
		question: "FAQ verify 1793703703617",
		answer: "FAQ answer body",
	},
	{
		slug: "faq-verify-1793703663305",
		question: "FAQ verify 1793703663305",
		answer: "FAQ answer body",
	},
	{
		slug: "faq-verify-1793703153566",
		question: "FAQ verify 1793703153566",
		answer: "FAQ answer body",
	},
	{
		slug: "faq-verify-1793703092724",
		question: "FAQ verify 1793703092724",
		answer: "FAQ answer body",
	},
	{
		slug: "faq-verify-1793703044570",
		question: "FAQ verify 1793703044570",
		answer: "FAQ answer body",
	},
] as const;

function slugify(value: string) {
	return (
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "faq"
	);
}

export async function GET() {
	const faqs = await prisma.faq.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			slug: true,
			question: true,
			answer: true,
			status: true,
		},
	});

	revalidateCmsState();
    return NextResponse.json({ success: true, items: faqs });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

	try {
		const payload = await request.json();
		const question = String(payload.question ?? "").trim();
		const answer = String(payload.answer ?? "").trim();

		if (!question || !answer) {
			throw new Error("Question and answer are required");
		}

		const item = await prisma.faq.create({
			data: {
				slug: String(payload.slug ?? "") || slugify(question),
				question,
				answer,
				status:
					String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED"
						? "PUBLISHED"
						: "DRAFT",
			},
		});

		const items = await prisma.faq.findMany({ orderBy: { createdAt: "desc" } });
		return NextResponse.json({ success: true, item, items });
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Unable to create FAQ",
			},
			{ status: 400 }
		);
	}
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

	try {
		const payload = await request.json();
		const id = String(payload.id ?? "").trim();
		const question = String(payload.question ?? "").trim();
		const answer = String(payload.answer ?? "").trim();

		if (!id || !question || !answer) {
			throw new Error("FAQ id, question, and answer are required");
		}

		const item = await prisma.faq.update({
			where: { id },
			data: {
				slug: String(payload.slug ?? "") || slugify(question),
				question,
				answer,
				status:
					String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED"
						? "PUBLISHED"
						: "DRAFT",
			},
		});

		const items = await prisma.faq.findMany({ orderBy: { createdAt: "desc" } });
		return NextResponse.json({ success: true, item, items });
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Unable to update FAQ",
			},
			{ status: 400 }
		);
	}
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

	try {
		const payload = await request.json();
		const id = String(payload.id ?? "").trim();

		if (!id) {
			throw new Error("FAQ id is required");
		}

		await prisma.faq.delete({ where: { id } });
		const items = await prisma.faq.findMany({ orderBy: { createdAt: "desc" } });
		return NextResponse.json({ success: true, items });
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : "Unable to delete FAQ",
			},
			{ status: 400 }
		);
	}
}
