# CMS Design

## 1. Scope

The CMS serves as the authoritative control layer for pages, blocks, navigation, settings, SEO, media, FAQs, leads, and site metadata. It manages both scraped content and manually authored content without a bespoke admin UI requirement at the first phase.

## 2. Content model

### Collection design

The platform includes the required collections:

- Pages
- Posts
- Authors
- Categories
- Tags
- FAQs
- Features
- Testimonials
- Gallery
- Navigation
- Footer
- Settings
- SEO
- Media
- Forms
- Leads

Each collection includes the common lifecycle fields required by the brief:

- `id`
- `slug`
- `status`
- `createdAt`
- `updatedAt`
- `publishedAt`

## 3. Page builder

The page builder supports blocks:

- Hero
- CTA
- Features
- Services
- Testimonials
- Gallery
- FAQ
- Stats
- Pricing
- Team
- RichText
- Video
- CustomSection

A `PageBlock` model preserves ordering while allowing pluggable block implementations. The system can register new block types without modifying the old block code by using a registry pattern.

## 4. Editorial workflow

- Draft -> Review -> Publish -> Archive
- Scheduled publish timestamps
- Soft delete safety net
- Audit log for content transitions
- Version tracking for optimistic locking

## 5. API contract expectations

The CMS exposes typed endpoints for:

- listing pages and posts
- creating or updating entities
- publishing and unpublishing items
- fetching page blocks with ordering
- updating metadata and SEO
- submitting form leads

## 6. Extensibility

The design supports future extension with:

- custom block components
- localization
- multi-site tenants
- workflow approvals
- role-based editor permissions

## 7. Implementation approach

The application uses a strong domain model and a repository/service pattern so the UI does not directly manipulate persistence. All writes go through validation and domain services, then Prisma repositories.
