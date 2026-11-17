# Database Design

## 1. Database technology

- Prisma ORM with PostgreSQL (preferred production database)
- SQLite may be used in local development for low-friction testing
- Prisma migration pipeline enforced for schema tracking and safe rollouts

## 2. Core design goals

- normalized relational structure
- soft deletes for content safety
- audit logs for traceability
- explicit status transitions for content lifecycle
- index coverage for search, filtering, and publish queries
- optimistic locking via `version` field for concurrent writes

## 3. Core collections

The CMS is built around the required collections:

- `Page`
- `Post`
- `Author`
- `Category`
- `Tag`
- `Faq`
- `Feature`
- `Testimonial`
- `Gallery`
- `Navigation`
- `Footer`
- `Setting`
- `Seo`
- `Media`
- `Form`
- `Lead`

## 4. Shared fields

Each entity includes:

- `id`
- `slug`
- `status`
- `createdAt`
- `updatedAt`
- `publishedAt`

Status values include:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`
- `SCHEDULED`

## 5. Normalized model strategy

Rather than embedding everything in a single table, the design uses separate entities for:

- content records
- metadata records
- SEO records
- taxonomy
- media assets
- page block definitions
- audit history

This avoids duplication and supports future multi-tenant or multi-site expansion.

## 6. Schema highlights

### `Page`

Stores the page shell and publishing metadata. It references a `Seo` row and a collection of page blocks.

### `PageBlock`

Stores the ordering and type of each dynamic section. Example types:

- hero
- cta
- features
- services
- testimonials
- gallery
- faq
- stats
- pricing
- team
- richText
- video
- customSection

### `Seo`

Stores canonical, robots, OG, Twitter, schema, and keywords.

### `Media`

Stores references to asset metadata, tags, and source URLs; not duplicate binary content by default.

### `AuditLog`

Tracks every write action with actor, resource type, resource id, action, and metadata.

## 7. Indexing strategy

Key indexes:

- slug + status
- createdAt desc
- publishedAt desc
- category relations
- tag relation tables
- `status` on all publishable entities
- `canonicalUrl` unique on SEO rows

## 8. Soft delete and audit

Every major entity includes:

- `deletedAt`
- `deletedBy`
- `createdBy`
- `updatedBy`

Audit logs capture actions like `CREATE`, `UPDATE`, `PUBLISH`, `UNPUBLISH`, `DELETE`, and `SCRAPE_IMPORT`.

## 9. Optimistic locking

The `version` field is used on all content and settings entities. This prevents stale writes during concurrent editing and supports safe editorial operations.

## 10. Prerequisite implementation

The Prisma schema in the project is the source of truth. Database migrations will be generated from this schema and should never be hand-edited in production.
