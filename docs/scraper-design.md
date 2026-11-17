# Scraper Design

## 1. Objective

The scraper collects structured website content from any target site and converts it into CMS-normalized content types. The system is designed to be idempotent, resilient, rate-aware, and suitable for scheduled and incremental content operations.

## 2. Strategy

The scraper uses a three-tier extraction strategy:

1. Static scraping with Cheerio for content discovery and metadata parsing
2. Hybrid flow for dynamic pages that require browser rendering
3. Browser automation with Playwright only when JavaScript-rendered content cannot be extracted statically

This follows the requirement to prefer static and hybrid strategies instead of using browser rendering by default.

## 3. High-level flow

- Crawl entry URLs and discover internal links
- Deduplicate URLs with canonical and normalized keys
- Fetch page content with retry and rate limiting
- Parse metadata, headings, navigation, FAQs, JSON-LD, and blocks
- Normalize into domain DTOs
- Validate with Zod
- Upsert into CMS stores using idempotent keys
- Emit audit and monitoring events
- Schedule follow-up tasks for incremental updates

## 4. Idempotency model

Every scraped record uses a deterministic fingerprint such as:

- canonical URL
- page type
- content hash
- target site + slug

If the content is unchanged, the system writes nothing. This prevents duplicate records and reduces churn in the CMS.

## 5. Retry, concurrency, rate limiting

- Retry policy: exponential backoff with jitter
- Concurrency controlled per domain and per queue worker
- Rate limiter based on request-per-second targets and host-specific quotas
- Batch processing for larger crawl jobs
- Queue-based work dispatch to decouple ingestion from scraping

## 6. Incremental crawling

Crawls are segmented into:

- initial site import
- incremental re-crawl
- changed-page revalidation

Page freshness is determined via:

- `lastModified` headers
- content hash comparison
- timestamp analysis
- sitemap metadata (when available)

## 7. Structured extraction outputs

The scraper extracts:

- page title
- description and keywords
- canonical URL
- robots directives
- OG tags
- Twitter tags
- JSON-LD values
- nav and footer blocks
- hero section text and CTA labels
- FAQ items
- testimonials and feature lists
- alt text and media metadata

## 8. Monitoring and logging

Each job emits:

- crawl start and end timestamps
- total pages fetched
- successful and failed requests
- rate-limit events
- parse warnings
- latency metrics
- queue depth

## 9. Scalability architecture

The scraper is built around queue workers and domain-level schedulers. That allows multiple crawl operations to run concurrently while keeping memory, network, and CPU usage under control.

## 10. Production rule

The scraper is a domain service, not a route handler. Route handlers should only validate input and delegate to the service layer.
