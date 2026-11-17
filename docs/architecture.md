# Phause Architecture Blueprint

## 1. Existing Codebase Analysis

The application is a Vercel-hosted Next.js 16 marketing website for a cybersecurity brand. The current app is structured around route groups and shared layout wrappers rather than a domain-based architecture. The present implementation is primarily static content rendered from server and client components, with a few route-level integrations:

- Shared navigation and footer via `src/components/layout/*`
- Static pages such as home, about, contact, registration, subscription, and checkout
- A small API integration for organization creation in `src/app/api/organizations/route.ts`
- Route constants in `src/lib/routes.ts`
- Local session persistence in `src/store/registration.store.ts`

This is a strong starting point for a CMS and scraper because the site already has a clean page structure, strong brand system, and centralized route metadata. The architecture work here is to extend that foundation without replacing core marketing patterns.

## 2. Website Analysis: phause.vercel.app

The live site communicates a security brand with the following sections in the landing page:

- Hero section with value proposition and CTA
- Social-proof metrics and trust indicators
- Philosophy / principles section
- Why-choose-us / differentiation section
- Services section
- Process / methodology section
- Testimonials
- FAQ
- Footer navigation + company metadata
- CTA banner with conversion intent

This structure is ideal for a CMS because it translates naturally to page blocks:

- Hero
- Stats
- Features
- Services
- Process
- Testimonials
- FAQ
- CTA
- Navigation
- Footer
- SEO metadata

The content model should therefore be designed around a block-based page builder and not an old-style static page file system. This allows the same content architecture to support blog pages, landing pages, and marketing pages while preserving the brand.

## 3. Target Architecture

The solution uses a layered architecture aligned with clean architecture and DDD principles:

- App shell: Next.js App Router pages and route handlers
- Features: domain-specific modules for scraper, CMS, SEO, media, page builder, settings
- Shared utilities: validation, constants, types, logging, security helpers
- Infrastructure: Prisma, cache, queue, logger, monitoring adapters

### Core modules

- `scraper` – website crawl, extraction, normalization, retry logic, queue orchestration
- `cms` – collection CRUD, lifecycle management, block ordering, publish workflows
- `page-builder` – dynamic section rendering using pluggable block types
- `seo` – metadata generation and canonical/OG/tag assembly
- `media` – asset registration and storage metadata
- `settings` – site-wide configuration and environment settings

## 4. Architectural Principles Applied

- SOLID: each service owns a single purpose; dependency inversion is implemented through adapters and interfaces
- DRY: repeated content and validation logic lives in shared schemas and utilities
- KISS: no deep generic abstraction beyond the actual required domain boundaries
- Clean architecture: business logic lives outside UI and route handlers
- DDD: page, content, SEO, and media are modeled as rich domain types
- Feature-based structure: each business capability is isolated and extendable

## 5. Production Design Decisions

- Prisma as the canonical data layer
- Zod for all API and scraper validation
- Cheerio for fast static extraction and JSON-LD parsing
- Playwright only for JS-heavy or anti-bot pages, behind a strategy pattern
- Redis/queue pattern for scheduled crawls and batch workers, abstracted behind repository/service interfaces
- Structured logs and tracing for every scraper run and CMS write
- Explicit status lifecycle: draft, scheduled, published, archived, deleted
- Soft deletes and audit trails for compliance and content lineage

## 6. Folder Structure

```text
src/
  app/
    api/
      cms/
      scrape/
      health/
      seo/
  features/
    cms/
      domain/
      application/
      infrastructure/
      ui/
    scraper/
      domain/
      application/
      infrastructure/
    page-builder/
      domain/
      application/
      infrastructure/
    seo/
      domain/
      application/
    media/
    settings/
  shared/
    lib/
    ui/
    types/
    validation/
    utils/
    hooks/
    constants/
  infrastructure/
    database/
    cache/
    queue/
    logger/
    monitoring/
  tests/
```

## 7. Production readiness

This system is engineered to scale from a small site to a content operation spanning large websites and publishing workflows. It is intentionally designed around reusability, normalized data, and a content pipeline that can ingest and publish content through a CMS rather than a one-off scraper.
