# API Contracts

## 1. Content scrape endpoint

### `POST /api/scrape`

Request body:

```json
{
  "url": "https://phause.vercel.app",
  "mode": "static",
  "maxDepth": 2,
  "limit": 25,
  "includeMedia": true,
  "incremental": true
}
```

Response:

```json
{
  "success": true,
  "jobId": "scrape_123",
  "pageCount": 12,
  "summary": {
    "pages": 12,
    "articles": 4,
    "faqs": 5,
    "images": 20,
    "metadata": 12
  },
  "warnings": []
}
```

## 2. CMS page creation endpoint

### `POST /api/cms/pages`

Request body:

```json
{
  "slug": "home",
  "title": "Home",
  "status": "DRAFT",
  "blocks": [
    {
      "type": "hero",
      "order": 0,
      "props": {
        "eyebrow": "Strengthen. Aware. Defend.",
        "title": "Secure your future",
        "description": "Protect your digital infrastructure."
      }
    }
  ]
}
```

Response: stored page record with lifecycle fields and created id.

## 3. SEO metadata endpoint

### `GET /api/seo?slug=/about`

Returns SEO metadata object for a page, including title, description, canonical, OG, and JSON-LD schema.

## 4. Health and monitoring endpoint

### `GET /api/health`

Returns:

- app status
- database status
- queue status
- version
- uptime
