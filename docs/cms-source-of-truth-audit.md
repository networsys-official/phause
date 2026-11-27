# CMS source-of-truth audit

Canonical source means editor writes and live route reads the same data source.

| Editor | Writes | Live route reads | Same source: yes or no |
|---|---|---|---|
| Subscription | `Page`, `Seo`, and one `CUSTOM_SECTION` `PageBlock` payload | `/subscription` + metadata read `Page/Seo`; `/api/cms/subscription-page` reads the same block | yes |
| Services | `PageBlock` items in `SERVICES_FEATURES` via `/api/cms/services` | `/services` page reads `Page/PageBlock` | yes |
| About sections | `Page/PageBlock` via `/api/cms/pages` | `/about` reads `Page/PageBlock` | yes |
| Testimonials | About `TESTIMONIALS` block via `/api/cms/testimonials` | `/about` reads the About page block | yes |
| Footer | `Footer/FooterLink` via CMS footer editor | Public `/api/footer` reads `Footer/FooterLink` | yes |
| Settings | `Setting` via `/api/cms/settings` | Public `/api/settings` and layout consumers read `Setting` | yes |
| Navigation | `Navigation/NavigationItem` via `/api/cms/navigation` | Public `/api/navigation` reads `Navigation/NavigationItem` | yes |
| FAQ | `Faq` via `/api/cms/faqs` | `/faq` reads published `Faq` rows | yes |
| Docs | `Page/PageBlock` via `/api/cms/docs` and `/api/cms/pages` | `/docs` reads `Page/PageBlock` | yes |
| Blog | `Post` plus optional `Media` via `/api/cms/blog` | `/blog` reads published `Post` rows | yes |
| Contact Form | `Form` via `/api/cms/forms`; form display copy may use the contact `PageBlock` | `/forms/[slug]` and `/contact` read `Form`/contact `Page` | yes |

## Subscription migration

- Canonical content now lives in `Page`, `Seo`, and one `CUSTOM_SECTION` `PageBlock` JSON payload.
- Migration `20261127000000_unify_subscription_page` copies existing `SubscriptionPage` metadata and section values into the canonical page/block and then drops the duplicate subscription content tables.
- The seed creates the subscription page, SEO, and canonical block; it does not create `SubscriptionPage` records.
- `SubscriptionPlan` and `PlanFeature` remain the plan-commerce source and are not page-content duplicates.

## Save-failed root cause

The earlier save failure came from a fragile split: the editor wrote `SubscriptionPage` plus eleven specialist tables, while metadata and live content also wrote/used `Page/Seo` and the transaction used a 4-second limit. A timeout or partial transaction surface was reported as save failure.

Exact fix: one transaction now updates only the canonical `Page`, `Seo`, and one `CUSTOM_SECTION` `PageBlock`; the route has an 8-second transaction limit and migration preserves old subscription content before removing specialist tables.
