# Dynamic CMS Upgrade Plan

## 1. Current state analysis

The project already contains the foundational components for a CMS-driven architecture:

- Next.js App Router
- Prisma + PostgreSQL data layer
- A page builder abstraction
- SEO metadata generation helpers
- CMS API route scaffolding
- A Prisma schema with Page, PageBlock, Media, Navigation, Footer, and AuditLog models

However, the current implementation still includes hardcoded content in the user-facing UI and route configuration:

- `src/lib/routes.ts` holds navigation and footer metadata as static arrays.
- `src/components/layout/Navbar.tsx` renders static navigation links.
- `src/components/layout/Footer.tsx` renders static footer copy and service links.
- `src/app/(main)/page.tsx` contains large content arrays and section definitions directly in the component.
- `src/app/api/cms/pages/route.ts` returns mock data instead of reading persisted data from the database.

That means the system is architecturally ready, but it is not yet fully content-driven in production.

## 2. Target architecture

The target is a content platform shaped like Payload, Strapi, Contentful, or Sanity, but integrated into the existing Next.js application.

### Core principles

- All editable content is persisted in PostgreSQL.
- Pages are assembled from reusable blocks.
- Navigation, footer, SEO, and media are all content objects.
- Publishing uses idempotent upsert semantics.
- Every write is auditable.
- Rendering is registry-driven so new block types are added via registration, not code patches in existing block definitions.

## 3. Migration plan

### Phase 1 — Content model hardening

1. Upgrade the Prisma schema with strong CMS domain models.
2. Add support for navigation hierarchy and footer link collections.
3. Add richer media metadata and checksum fields for deduplication and idempotency.
4. Add optimistic locking via `rowVersion` and soft-delete support via `deletedAt`.

### Phase 2 — CMS APIs

Create production APIs for:

- `GET /api/pages`
- `POST /api/pages`
- `PUT /api/pages/:id`
- `DELETE /api/pages/:id`
- `GET /api/media`
- `POST /api/media`
- `GET /api/navigation`
- `PUT /api/navigation`
- `GET /api/footer`
- `PUT /api/footer`

Each endpoint will validate payloads, enforce authorization, log events, and use transactional upserts.

### Phase 3 — Dynamic rendering

- Launch a server-side content loader that resolves the page by slug.
- Assemble blocks using a block registry and renderer map.
- Render navigation, footer, and SEO from database models instead of static route arrays.
- Keep a single fallback seed payload for local development when the database is empty.

### Phase 4 — Admin experience

- Add a CMS dashboard with pages, media, navigation, footer, SEO, forms, leads, and audit log views.
- Add preview and publish states.
- Add versioning with draft, published, archived, and rollback support.

### Phase 5 — Security and governance

- RBAC by role
- CSRF protection for write endpoints
- XSS protection via sanitization and validation
- Structured audit logging for every mutation
- Rate limiting and request tracing

## 4. Database design highlights

### Page model

- `slug` unique and versioned
- `status` supports Draft / Published / Archived / Scheduled
- `seoId` references SEO content
- `blocks` relation for assembled dynamic content

### Navigation model

- `key` supports named navigation sets such as `main`, `footer`, `mobile`
- `position` controls ordering
- `NavigationItem` provides hierarchical structure and reusable link objects

### Footer model

- `brandName`, `description`, `copyright`
- `FooterLink` supports nav links, social links, and utility links

### Media model

- `title`, `altText`, `caption`, `url`, `width`, `height`, `mimeType`, `size`, `tags`, `checksum`
- designed for deduplication and image versioning
- supports optimization and validation through a service layer

### Idempotent patterns

- `upsert` on unique slug and `checksum`
- unique `slug` validation at the application layer
- media hash validation on upload
- transactional writes for page publishing and media import

## 5. API contract summary

### Page API

```json
{
  "slug": "home",
  "title": "Home",
  "status": "PUBLISHED",
  "seo": {
    "title": "Phause | Security Platform",
    "description": "Enterprise-grade security" 
  },
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "props": {
        "eyebrow": "Strengthen. Aware. Defend.",
        "title": "Protect your digital future",
        "description": "..."
      }
    }
  ]
}
```

### Media API

```json
{
  "title": "Homepage hero",
  "altText": "Security dashboard preview",
  "url": "/uploads/hero.jpg",
  "mimeType": "image/jpeg",
  "size": 241372,
  "tags": ["hero", "homepage"]
}
```

### Navigation API

```json
{
  "key": "main",
  "items": [
    { "label": "Home", "href": "/", "position": 0 },
    { "label": "About", "href": "/about", "position": 1 }
  ]
}
```

## 6. Open/Closed block registry

The block system follows an open/closed pattern:

- A block type must be registered in the database enum or block registry.
- A renderer must also be registered.
- Existing block logic remains unchanged when adding new blocks.

This prevents code-level patches for new content structures.

## 7. Real implementation strategy for this repo

The current code already has the necessary foundation. The next steps in this codebase are:

1. Replace mock `GET /api/cms/pages` output with Prisma-backed queries.
2. Make navigation and footer read from CMS records.
3. Add a dynamic `CmsPageRenderer` that reads the database page and renders the registry-backed blocks.
4. Seed the default site content for home, about, contact, and subscription pages.
5. Keep the static marketing pages as a fallback until the CMS-backed renderers replace them.

This keeps the project production-safe while evolving the architecture toward a true content platform instead of a static landing page.
