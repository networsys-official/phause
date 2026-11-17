# Implementation Plan

## Phase 1 – Architecture and foundation

- Add Prisma schema and shared validation layer
- Implement logger, error helpers, and route security wrappers
- Add health and environment validation
- Add testing configuration and CI pipeline

## Phase 2 – Scraper foundation

- Implement strategy-based extraction service
- Add static parser using Cheerio
- Add Playwright adapter for dynamic rendering
- Add queue and rate-limiter wrappers
- Add idempotent upsert flow

## Phase 3 – CMS domain model

- Define Page, PageBlock, SEO, Media, and taxonomy models
- Build repository pattern for CMS writes
- Add page builder registry and pluggable block support
- Add status transitions and audit logging

## Phase 4 – SEO and metadata

- Build metadata compiler
- Add canonical and OG tag generation
- Add JSON-LD support
- Implement dynamic metadata APIs and page-level SEO assembly

## Phase 5 – API and UI integration

- Add route handlers for scrape and CMS endpoints
- Add an internal CMS page and scraper dashboard
- Hook the page builder into server rendering
- Expose live content operations for the marketing site

## Phase 6 – Hardening and verification

- Run lint, typecheck, and tests
- Validate CI pipeline
- Review security controls and production assumptions
- Final build verification
