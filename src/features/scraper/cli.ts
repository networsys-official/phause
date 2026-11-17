import { scraperService } from "./scraper.service";

export async function runCli() {
  const targetUrl = process.argv[2] ?? "https://phause.vercel.app";

  const result = await scraperService.scrapeSite({
    url: targetUrl,
    mode: "static",
    maxDepth: 1,
    limit: 10,
    includeMedia: true,
    incremental: true,
  });

  console.log(JSON.stringify(result, null, 2));
}
