# Studio navigation audit

## Route matrix

| Sidebar label | URL | Route exists? | Page exists? | Working? |
| --- | --- | --- | --- | --- |
| Overview | /studio | Yes | Yes | Yes |
| Pages | /studio/pages | Yes | Yes | Yes |
| Blog | /studio/blog | Yes | Yes | Yes |
| FAQs | /studio/faqs | Yes | Yes | Yes |
| Services | /studio/services | Yes | Yes | Yes |
| Media | /studio/media | Yes | Yes | Yes |
| Navigation | /studio/navigation | Yes | Yes | Yes |
| Footer | /studio/footer | Yes | Yes | Yes |
| SEO | /studio/seo | Yes | Yes | Yes |
| Forms | /studio/forms | Yes | Yes | Yes |
| Leads | /studio/leads | Yes | Yes | Yes |
| Settings | /studio/settings | Yes | Yes | Yes |
| Profile | /studio/profile | Yes | Yes | Yes |
| Users | /studio/users | Yes | Yes | Yes |
| Audit Logs | /studio/audit | Yes | Yes | Yes |

## Health summary

- Missing routes: none
- Dead links: none
- Duplicate pages: none
- Unreachable screens: none
- Incorrect toolbar actions: none

## Context-sensitive actions

- Media: Upload Media, Bulk Upload, Import Assets
- FAQs: Create FAQ, Import FAQs
- Blog: Create Blog Post, Import Posts
- Pages: Create Page

## Guardrails

- Any unknown Studio URL resolves to the Studio-specific not-found screen.
- Sidebar items are centrally registered in the studio navigation config and validated at runtime.
- Invalid navigation references produce a warning in the console and a health report entry.
