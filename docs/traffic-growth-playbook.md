# Organic Search Growth Playbook (Audiosen)

This release is organic SEO only. Do not create, enable, or fund Google Ads. Do not change the
rendered website copy, layout, navigation, forms, styling, or images as part of this release.

## 1. Search intent and canonical landing pages

Use one indexable page for each primary intent so Audiosen pages do not compete with one another:

| Search intent | Canonical destination |
| --- | --- |
| hearing aids/store/centre near me in Dehradun | `/hearing-aids-dehradun` |
| hearing test in Dehradun | `/hearing-test-dehradun` |
| hearing-aid fitting in Dehradun | `/hearing-aid-fitting-dehradun` |
| hearing-aid repair in Dehradun | `/hearing-aid-repair-dehradun` |
| home hearing care | `/home-hearing-care` |
| hearing aids across India | `/hearing-aids-india` |
| speech and communication enquiries | `/speech-language-services` |

Redirect `/home-hearing-care-dehradun` permanently to `/home-hearing-care`. Keep generic enquiry,
search, unpublished catalog, unapproved offer/care-plan, review, admin, API, thank-you, and error
surfaces out of the index until their facts and publication state are approved.

## 2. Verified local identity

Use this exact public identity everywhere; it is derived from the owner-confirmed website record and
permanent signage:

- Name: `Audiosen`
- Business name: `Audiosen Advanced Hearing Care Solutions`
- Address: `7, 11, Ram Vihar St, near ONGC Hospital, Dehradun, Uttarakhand 248001`
- Phone and WhatsApp: `+91 89230 92563`
- Email: `contactaudiosen@gmail.com`
- Canonical domain: `https://audiosen.com`

Do not invent opening hours, professional credentials, ratings, review counts, prices, discounts,
warranties, outcomes, or medical claims. Opening hours remain unverified and must not be added to
the website schema or changed in Google Business Profile during this release.

## 3. Google Business Profile owner checklist

1. Keep the profile name exactly `Audiosen`, matching permanent signage.
2. Use `Hearing aid store` as the primary category.
3. Do not add Audiologist, ENT, medical-clinic, or speech-professional categories until the matching
   practitioner credentials and real service delivery are recorded and approved.
4. Set the website link to `https://audiosen.com/hearing-aids-dehradun` and the appointment link to
   `https://audiosen.com/book-consultation`.
5. Make the address and phone exactly match the verified identity above. Leave hours unchanged until
   verified by the owner.
6. List only services already described on the public website, using the same factual wording. Do
   not add specific tests, equipment, brands, pricing, offers, or qualifications from memory.
7. Upload only current, rights-cleared photographs of the actual exterior/signage, entrance,
   premises, products, and team members who have consented.
8. Request reviews from genuine customers without incentives or review gating. Reply without
   exposing health information and without inserting unnatural keywords.
9. Do not enable a website review section or aggregate-rating schema unless the review source and
   publication consent are approved.

Google local results depend mainly on relevance, distance, and prominence; no implementation can
guarantee the top position or override the searcher's location.

## 4. Indexing operations

1. Verify the domain property in Google Search Console.
2. Submit `https://audiosen.com/sitemap.xml` after production deployment.
3. Inspect and request indexing for the canonical priority URLs in section 1, starting with the
   Dehradun page.
4. Confirm the apex domain is canonical, `www` redirects to it, every sitemap URL returns `200`, and
   each indexable page has a self-canonical URL and unique title/description.
5. Confirm `robots.txt` allows public pages, blocks private admin/API crawling, references only the
   production sitemap, and staging responds with `noindex` plus a crawler-wide disallow.
6. Recheck Search Console Page indexing, HTTPS, Core Web Vitals, manual actions, and security issues
   after release. Investigate exclusions; do not submit duplicate or noindex URLs.

## 5. Authority work without ads

1. Correct stale name/address/phone entries on real profiles and directories. Prioritize Bing Places,
   Apple Business Connect, legitimate local/healthcare directories, suppliers, and social profiles
   that Audiosen actually controls.
2. Seek genuine local mentions from partners, community organisations, and relevant publications;
   never buy links or mass-create directory entries.
3. Publish new articles only in a separately approved content release using source-checked website
   facts. This SEO-only release must not alter visible pages.
4. Review Search Console query data before proposing future topics; avoid creating multiple pages for
   the same intent.

## 6. Measurement

Review weekly:

- Search Console clicks, impressions, click-through rate, average position, indexed URLs, and queries
  for Dehradun hearing-aid, hearing-test, fitting, repair, home-care, and speech intents.
- Google Business Profile calls, direction requests, website clicks, search terms, and photo views.
- Consented GA4 events already implemented by the app: `call_click`, `whatsapp_click`,
  `book_consultation`, `contact_submit`, `form_start`, `home_visit_request`, `repair_enquiry`,
  `speech_consultation`, and `google_directions_click`.
- A fixed, location-aware Dehradun rank sample. Treat it as a trend, not a promise of what every
  searcher will see.

Record a pre-release baseline and compare at 7, 28, and 90 days. Organic improvements normally take
time to crawl, reprocess, and earn prominence; do not judge the release from an immediate search.
