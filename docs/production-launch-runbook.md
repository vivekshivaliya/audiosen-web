# Audiosen production launch runbook

Production remains blocked until every item marked **external gate** is complete. A successful build
does not approve business facts, legal content, credentials, commercial programs, Google data, or
media rights.

## 1. Revoke legacy exposure

- **External gate:** revoke the Web3Forms access key and EmailJS public/service/template identifiers
  previously present in the removed workspace-root legacy HTML.
- **External gate:** revoke unused Razorpay keys and webhooks, and verify no payment endpoint remains
  active. Audiosen accepts website enquiries only; payment confirmation stays written and offline.
- **External gate:** revoke the old Gmail app password and confirm the retired Mailcow host has no
  live mailbox, forwarding rule, DNS dependency, or required historical mail before shutdown.
- **Observed blocker (2026-08-22):** public DNS still routes the apex MX to `mail.audiosen.com`, and
  that host still resolves to the legacy Mailcow address. The apex SPF is also still
  `v=spf1 mx a -all`, with DMARC at monitoring-only `p=none`. Do not shut down Mailcow or claim the
  Cloudflare/ACS cutover is complete until mailbox ownership and historical-mail retention are
  checked, replacement routes are tested, and the DNS change is explicitly authorized.
- Retain the old Azure Table and approved import sources read-only for the audited 30-day migration
  window; do not delete them during deployment.

## 2. Azure platform

- Provision Azure Database for PostgreSQL with private networking, TLS, backups, point-in-time
  restore, least-privilege application and migration identities, and audited schema migration.
- Provision separate public product-media and private attachment Blob containers. The existing
  product-media container must allow anonymous reads for individual Blobs without container listing;
  set `AZURE_PRODUCT_MEDIA_CONTAINER` and an exact credential-free HTTPS
  `CATALOG_PUBLIC_MEDIA_BASE_URL`, and keep both separate from the private upload configuration.
  Private intake must remain quarantined until Defender/malware results and the metadata-stripping
  promotion worker approve it. PDF promotion is blocked until a vetted sanitizer is installed.
- Grant App Service and worker managed identities only the Blob, PostgreSQL, Key Vault, and email
  permissions they need. Store secrets in Key Vault/App Service references, never repository files.
- Configure the [Azure Function outbox worker](../azure-functions/README.md), stale-lock recovery, retry schedule, dead-letter alert,
  retention timer, quarantine cleanup, and orphan-blob reconciliation. Alert on catalog media cleanup
  failures; reconcile random `catalog/` Blobs against `ProductMedia.storageKey` before lifecycle deletion.
- Upgrade `ASP-audiosenrg1-aba0` from Basic B1 to Standard S1, configure Node 22 with
  `node server.js`, Always On, HTTPS-only, HTTP/2, TLS 1.2+, and Health Check `/api/health`.
- Use the true `audiosen-vivek/seo-staging` deployment slot; do not deploy this release to the old
  separate staging app or to a generic `staging` slot. Discover its regionalized
  `defaultHostName` from Azure, store the exact HTTPS origin in the GitHub repository variable
  `AZURE_STAGING_URL`, and keep its noindex flags sticky to the slot.

## 3. Cloudflare and origin

- **External gate:** restrict the Azure origin to current Cloudflare proxy networks and approved
  Azure management/health paths. Set `TRUST_CLOUDFLARE_IP=true`; do not trust arbitrary forwarded
  headers.
- Configure Cloudflare Turnstile and edge rate rules for enquiry and upload endpoints. Production
  forms fail closed when the Turnstile secret is absent. Set an independent, high-entropy
  `UPLOAD_VERIFICATION_GRANT_SECRET` on every active slot instance. Private uploads also fail closed
  unless the trusted-proxy policy yields a client IP, so enable `TRUST_CLOUDFLARE_IP` only after the
  Azure origin is restricted to Cloudflare. Verify that edge/application logs redact the
  `X-Audiosen-Turnstile-Token` header, attachment claim tokens, and signed upload grants.
- Disable Rocket Loader and Browser Insights for the application until their exact scripts are
  deliberately admitted to the nonce CSP. Do not weaken CSP to silence a blocked beacon.
- Redirect the `www` host to the canonical apex and validate HSTS, TLS mode, origin certificates,
  cache bypass for `/api`, `/admin`, and `/thank-you`, and request-body limits.
- Do not apply Cloudflare full-page HTML caching to nonce-protected documents. Each HTML response
  must be rendered with the same fresh nonce carried by its response CSP; cache static Next chunks
  and approved media separately.
- Purge any previously cached `/images/products/*`, `/brands/*`, the retired
  `/images/services/hearing-aid-trial.jpg` composite, and matching `/_next/image` responses. Those
  legacy draft assets are denied at the application edge until each replacement Blob has recorded
  commercial-use rights; an older Cloudflare cache entry must not bypass that gate.

## 4. Email and DNS

- Verify `support@audiosen.com` as the Azure Communication Services provider sender and configure independent
  staff/patient outbox delivery. Patient messages use `contactaudiosen@gmail.com` as the public reply-to address; staff mail routes only to `vivekshivaliya10@gmail.com`.
- **External gate:** configure Cloudflare Email Routing from `support@audiosen.com` to the owner
  inbox after the Mailcow check.
- Align SPF, ACS DKIM selectors, Cloudflare routing records, and staged DMARC reporting. Validate
  before enforcing a stricter DMARC policy.
- Run synthetic outbox messages only in staging; never submit real patient narratives during smoke
  tests.

## 5. Owner, legal, and content approval

- **External gate:** connect and approve the exact Google Business address, hours, Maps URI, and
  review URI. Until then, the site must not publish them.
- **External gate:** approve at least four source-checked, rights-cleared, inventory-approved models
  for each primary brand before making the database catalog indexable.
- Keep `CATALOG_STAGING_PREVIEW_ENABLED=false` in production. It may be enabled only in the private
  staging slot while the 24 draft guides are reviewed; default production requests return a strict
  branded 404 and public navigation/search omit those surfaces.
- Keep the independent `CATALOG_PUBLICATION_ENABLED=false` until all four primary brands each have
  an Owner-confirmed brand source and at least four fixed-manifest, source-confirmed, `PUBLISHED`
  models whose every attached image is an optimized public Blob with explicit rights evidence and
  Owner approval. Turning the flag on is not an override: a missing database, media base, brand,
  fourth model, source field, primary selection, rights field, or approved image makes the server
  snapshot fail closed, keeps catalog records out of sitemap/search, and returns 404 for every
  catalog decision route. Never enable staging preview as a production fallback.
- Before enabling publication, test the opaque `/catalog-media/<ProductMedia UUID>` path with WebP
  and AVIF fixtures. It must never reveal storage keys, follow Blob redirects, exceed 5 MiB or five
  seconds, accept a MIME/magic mismatch, or cache an approval failure. Revocation must stop new
  delivery within the five-minute browser cache ceiling. Roll back by setting
  `CATALOG_PUBLICATION_ENABLED=false` and purging catalog HTML/media CDN entries.
- **External gate:** record exact products/services, dates, prices, deposits, warranties, eligibility,
  and written terms before enabling an offer, rental, care plan, or trial claim. Use the Owner-only
  `/admin/offers` checklist for the retained campaign; changing facts or mappings disables it and
  requires a new approval. Confirm expiry and emergency-disable behavior in staging.
- **External gate:** complete Indian legal review of the privacy notice, consent/guardian workflow,
  deletion/withdrawal process, retention schedule, terms, and commercial content. Set
  `LEGAL_CONTENT_APPROVED=true` only after approval. This is a server-side runtime setting; keep it
  false in staging and production until the approved legal revision is recorded.
- Confirm Google SSO allows only `vivekshivaliya10@gmail.com` initially and that the Owner role is
  present in the audit log.

## 6. Migration and release

1. Run Prisma migrations using the migration identity.
2. Dry-run the Azure Table and owner-approved NDJSON imports; archive count, source hash, sample
   hashes, and rejection report. Run the commit mode only with explicit owner identity.
3. Run lint, strict TypeScript, unit/integration tests, production build, E2E/accessibility suites,
   link crawl, schema checks, secret scan, dependency audit, Lighthouse, and ZAP against staging.
4. Smoke every enquiry type with fixture delivery, admin RBAC, uploads/quarantine, outbox retries,
   Google read fixtures, approved snapshot rendering, 404/error states, and all target viewports.
5. Verify sitemap/robots, noindex routes, approved phone/email scans, Core Web Vitals budgets, and
   that 3D is absent from the initial marketing bundle.
6. Obtain final owner sign-off, then perform a controlled staging-slot swap. Monitor errors, outbox,
   database saturation, upload quarantine, 4xx/5xx rate, and field vitals; keep an immediate slot
   swap-back path.
