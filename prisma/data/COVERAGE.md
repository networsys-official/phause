# Phause content pack: coverage map

Source: `Phause_Full_Website_Content.docx` (prepared 18 Nov 2026). It is a .docx, not a PDF.
Data file: `phause-content.json`, generated from the document by script, not retyped.

## Checks run
- Every non-heading line of the document was compared against the JSON. All differences are expected transformations (button text split from its link, numbering moved into a `number` field, "Why it matters" stored as a named field).
- Item counts match the document: home 6 platform cards / 5 steps / 4 reasons / 4 audiences / 3 challenge cards / 4 FAQ preview; services 8 features; how-it-works 5 steps; solutions 5 personas; about 4 values / 6 capabilities; pricing 5 considerations / 4 FAQ; resources 4 categories / 4 featured; 24 FAQs; 4 blog posts; 8 docs groups; 6 contact fields; 12 image briefs.
- Publishable text contains no `[placeholder]` brackets and none of the document's banned words. The only hits are FAQ #3, which names them in order to say Phause is not one.

## Destination map

| Document section | Destination | Status |
|---|---|---|
| Brand foundation: footer description, social description, trust note | Footer module, default SEO/OG description | Seed (placement of the trust note is a proposal) |
| Brand foundation: audience, voice, preferred/avoided words, pillars | Editorial only | Not site copy. Kept in `editorial` / `global` |
| Homepage (9 sections) | Page `home` blocks | Seed |
| Platform and Features | Page `services` blocks | Seed |
| How It Works | New page `how-it-works` (renders via `/[slug]`) | Seed |
| Solutions | New page `solutions` (renders via `/[slug]`) | Seed |
| About | Page `about` blocks | Seed; hide timeline and testimonials |
| Pricing and Plans | Page `subscription` blocks | Seed copy only; **no prices** (they come from the plans service) |
| Resources | New page `resources` | Seed; newsletter form omitted |
| Documentation | Docs module | Seed hero, nav and quick-start only (see decisions) |
| FAQ (24) | FAQ collection + `faq` page | Seed |
| Contact | Page `contact` + Form `contact-form` | Seed copy; keep existing field keys |
| Image, SEO and publishing guide | `imageBriefs`, `editorial`, `doNotPublish` | Reference only. Images are not supplied |
| Security and Trust | Page `security-policy` | Hero + 4 principles only |
| Privacy, Cookie, Terms, Responsible Disclosure | SEO fields only | **Blocked** (placeholders, legal review) |
| CMS entry map | Developer guidance | Not site content. Used to choose block names |
| 4 blog articles | Blog posts | Seed |

## Decisions needed from you (the content cannot decide these)
1. Legal entity name, privacy contact, security contact email. Needed before Privacy, Terms, Cookie, Responsible Disclosure and the Security controls section can be published.
2. Existing footer and settings values `supportPhone` (+1 (555) 010-PHAUSE) and location "San Francisco, CA" look like placeholders. The document says to remove unverified contact details and fake offices. Confirm the real values or blank them.
3. Navigation menu: the document gives no exact menu. `navigation` in the JSON is a proposal.
4. Docs: the document supplies titles for about 40 help articles but the body for only one (the quick-start). The others are DRAFT stubs and must not be published empty.
5. `servicesProcess`, `servicesAudiences`, `servicesBenefits`, `servicesFaq` have block names but no separate copy in the document. The JSON re-uses the matching Home copy (flagged `_derived`). Confirm or remove.
6. Blog excerpts are not in the document, so the meta description is used. Featured images do not exist yet.
7. The fourth article is categorised "Security Awareness", but the Resources page lists four categories that do not include it. Pick one set.
8. The Resources featured list titles two articles slightly differently from the article titles; the JSON links them by slug.

## Not in the seed on purpose
Customer logos, testimonials, statistics, certifications, uptime/SLA claims, office locations, phone numbers, plan prices, trial lengths, discounts, refunds. The document says not to publish them until verified.
