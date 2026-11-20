import { prisma } from "@/infrastructure/database/prisma";
import { scraperService } from "../features/scraper/scraper.service";

async function main() {
  const result = await scraperService.persistScrapedSite({
    url: "https://phause.vercel.app",
    mode: "browser",
    maxDepth: 4,
    limit: 25,
    includeMedia: true,
    incremental: true,
    routes: ["/", "/about", "/contact", "/subscription", "/registration"],
  });

  const liveMediaUrls = Array.from(
    new Set(
      result.pages.flatMap((page) =>
        (page.media ?? []).map((asset) => new URL(asset, page.url).toString()),
      ),
    ),
  );

  const staleMedia = await prisma.media.findMany({
    where: { url: { contains: "/logo/" } },
    select: { id: true },
  });

  if (staleMedia.length > 0) {
    await prisma.media.deleteMany({
      where: {
        id: { in: staleMedia.map((item) => item.id) },
      },
    });
  }

  if (liveMediaUrls.length > 0) {
    await prisma.media.deleteMany({
      where: {
        url: { notIn: liveMediaUrls },
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        jobId: result.jobId,
        pageCount: result.pageCount,
        warnings: result.warnings,
        summary: result.summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Failed to sync the live Phause site.", error);
  process.exit(1);
});
