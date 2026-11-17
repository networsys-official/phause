import { NextRequest, NextResponse } from "next/server";

import { scrapeRequestSchema } from "@/shared/lib/validation";
import { scraperService } from "@/features/scraper/scraper.service";

export async function GET() {
  return NextResponse.json({
    success: true,
    supportedModes: ["static", "hybrid", "browser"],
    status: "healthy",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = scrapeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid scraping request.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await scraperService.scrapeSite(parsed.data);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Scraping failed.",
      },
      { status: 500 },
    );
  }
}
