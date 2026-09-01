# Audiosen backend and admin foundation

This foundation is intentionally unavailable until its production dependencies are configured. It does not contain development auth bypasses, fake Google data, embedded credentials, or public patient-file reads.

## Required deployment dependencies

1. Provision PostgreSQL with encrypted transport, backups, point-in-time recovery, and access limited to the application and maintenance jobs.
2. Copy the variable names from `.env.example` into the platform secret store. Never place values in Git.
3. Generate `AUTH_SECRET`, `THANK_YOU_CONTEXT_SECRET`, `IP_HASH_SECRET`, and `UPLOAD_VERIFICATION_GRANT_SECRET` as independent high-entropy values. The upload-grant secret must contain at least 32 bytes and must be identical across the active web instances during its 30-minute token lifetime.
4. Generate a 32-byte enquiry encryption key, encode it as base64, set `ENQUIRY_FIELD_ENCRYPTION_KEY`, and set its immutable version label. Retain old versions in `ENQUIRY_FIELD_ENCRYPTION_KEYS` during rotation; deleting an old key makes its records unreadable.
5. Run `npm run prisma:generate`, then `npm run db:migrate:deploy` with a migration identity. The web runtime should not have schema-alter permissions.
6. Configure a Google OAuth web client for the exact Auth.js callback URL, set the explicit `ADMIN_EMAIL_ALLOWLIST`, and set one matching `ADMIN_OWNER_EMAIL`. Google accounts must report a verified email. Admin sign-in fails closed if any auth/database setting is absent.
7. Configure Cloudflare Turnstile. Public production enquiry APIs return `BOT_PROTECTION_NOT_CONFIGURED` until both the public site key and server secret are installed. Forms without an attachment submit `turnstileToken` to the enquiry API. A private upload sends the token in the `X-Audiosen-Turnstile-Token` request header so the server can verify it before reading multipart bytes; the same single-use Turnstile response is never submitted a second time. Neither Turnstile responses nor upload verification grants are stored or logged.
8. Configure Azure Communication Services Email and verify `support@audiosen.com` on the connected domain. Prefer `AZURE_COMMUNICATION_EMAIL_ENDPOINT` with a managed identity granted the minimum email-send role; use `AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING` only from the platform secret store when managed identity is unavailable. Staff mail is queued only for `vivekshivaliya10@gmail.com`; patient confirmations identify `support@audiosen.com` and `8923092563`.

## Enquiry API

New forms use `POST /api/enquiries` with `Content-Type: application/json` and an `Idempotency-Key` header. The accepted canonical discriminators are `contact`, `appointment`, `product_enquiry`, `request_price`, `offer`, `home_visit`, `repair`, `speech`, `finder`, `trial`, `callback`, `audiogram`, and `whatsapp_lead`. `consultation` and `hearing_aid_finder` remain compatibility aliases.

Shared fields are `name`, `phone`, optional `email`, `city`, `service`, optional `brand`, `device`, `ageGroup`, `message`, attribution/context, `consent: true`, the `website` honeypot, and `turnstileToken` when no private upload grant is present. `guardianConsent: true` is enforced server-side for a child/teen age group, a numeric age under 18, or the pediatric finder path, and that fact is retained with the enquiry routing context. Type-specific fields belong in `details`. The current `/api/contact` route is a compatibility adapter over the same persistence service.

A successful response contains:

```json
{
  "ok": true,
  "reference": "AUD-YYYYMMDD-XXXXXXXX",
  "referenceId": "AUD-YYYYMMDD-XXXXXXXX",
  "redirectTo": "/thank-you",
  "thankYouUrl": "/thank-you",
  "deduplicated": false
}
```

The reference/service success context is held in a signed, ten-minute, HttpOnly, SameSite cookie and cleared after the thank-you page consumes it. The page does not trust a query-string reference.

PostgreSQL creates the enquiry and independent staff/patient `EmailOutbox` rows in one transaction. Clinical narrative, arbitrary details, finder preferences, private notes, and follow-up notes are AES-256-GCM envelopes with nonce, authentication tag, and key version. Staff outbox bodies say “View in protected admin” instead of duplicating those narratives in plaintext.

Without `DATABASE_URL`, local development writes a single ignored `data/enquiries-v2.ndjson` event containing the same encrypted sensitive envelope and outbox shape. Production fails closed unless `ALLOW_NDJSON_ENQUIRY_FALLBACK=true` is deliberately set; that override is not recommended.

## Email outbox

Production uses the independently deployable timer wrapper in
[`azure-functions/README.md`](../azure-functions/README.md). It calls the same exported batch contract
as the CLI below; claim, retry, stale-lock recovery, and ACS delivery logic are not forked. The CLI
remains useful for a supervised non-Functions deployment or a reviewed one-shot operation:

```text
npm run outbox:run
npm run outbox:watch
```

Jobs are claimed conditionally, stale locks recover after ten minutes, staff and patient jobs retry independently with exponential delay, and exhausted jobs become `DEAD`. The worker calls Azure Communication Services Email with the outbox UUID as its provider operation ID and records the returned provider message ID/status without logging recipients or narrative. `support@audiosen.com` is enforced as the verified sender, and user-engagement tracking is disabled. Alert on `DEAD`, repeated `FAILED`, and worker absence.

## Private repair/audiogram uploads

`POST /api/uploads/intake` accepts multipart fields `purpose` (`device_photo` or `audiogram`) and one `file`, plus the Turnstile response in the `X-Audiosen-Turnstile-Token` header. Origin, declared request size, signing-key availability, trusted production client IP, rate limits, and Turnstile are checked before the multipart stream is read or any Blob is created. The response supplies a short-lived `attachmentId`, one-time `claimToken`, expiry, and HMAC-signed `verificationGrant`. The grant is bound to the attachment ID, purpose, claim-token hash, trusted client IP (when enabled by the existing proxy policy), user agent, and 30-minute expiry.

The enquiry submits `details.attachments: [{ attachmentId, claimToken, verificationGrant }]` and omits the already-consumed `turnstileToken`. `/api/enquiries` validates the signed grant for the same client before persistence, then strips it. Only the claim-token hash is stored. Claiming the `READY` upload session in the enquiry transaction makes the pair one-time; a replay with a different idempotency key is rejected, while a retry with the original idempotency key returns the already-created enquiry. Files use random keys under a private `quarantine/` prefix, and attachment IDs alone cannot claim them.

The intake checks size, declared MIME, and magic bytes. It does not provide a public read URL. Configure Microsoft Defender for Storage on-upload malware scanning and scan-result delivery before enabling uploads. `npm run uploads:scan` recognizes the Defender `Malware scanning scan result` tag, deletes malicious objects, and only promotes threat-free images after re-encoding with Sharp to remove embedded metadata. Microsoft warns that blob tags are not tamper-resistant, so production must also retain Defender/Event Grid or Log Analytics evidence and restrict tag-write RBAC. See [Microsoft’s malware scanning overview](https://learn.microsoft.com/en-us/azure/defender-for-cloud/introduction-malware-scanning).

PDFs remain blocked with `pdf_metadata_sanitizer_not_configured` even after a clean malware result. A vetted PDF sanitizer must be integrated before audiogram PDF download can ship. Until Defender scan-result delivery and PDF sanitization are operational, secure uploads are a deployment blocker, not a completed user feature. Configure Blob lifecycle/soft delete for orphan recovery as an additional control.

## Owner-only catalog product-media intake

`POST /api/admin/catalog/media` is the only catalog-image intake path. It accepts a same-origin
`multipart/form-data` submission from an authenticated active `OWNER`; the Owner identity is checked
again inside the serializable database transaction that creates the `ProductMedia` row and append-only
audit entry. Admin and Staff sessions cannot upload. The response always returns to
`/admin/catalog` with a `303` and a bounded notice; raw storage, decoder, and database errors are not
reflected into the URL.

Configure these values together:

```text
AZURE_BLOB_SERVICE_URL=https://storage-account.blob.core.windows.net
AZURE_PRODUCT_MEDIA_CONTAINER=audiosen-product-media
CATALOG_PUBLIC_MEDIA_BASE_URL=https://storage-account.blob.core.windows.net/audiosen-product-media
```

`AZURE_PRODUCT_MEDIA_CONTAINER` must name an existing container that differs from the private
`AZURE_BLOB_CONTAINER`. It must permit anonymous reads of individual Blobs (`blob` access) but not
container listing. The web managed identity needs data write/delete/read-properties access scoped to
this container; do not use an account key, connection string, SAS query, or auto-create fallback.
`CATALOG_PUBLIC_MEDIA_BASE_URL` is the exact credential-free HTTPS Blob or CDN base used by the
approved opaque `/catalog-media/[id]` delivery adapter. Keep the delivery base stable even when a CDN
fronts the storage account.

The route caps the complete multipart body at 9 MB and the single file at 8 MB. JPEG, PNG, and WebP
must pass both declared-MIME and magic-byte checks, then decode through Sharp with a 40-megapixel and
12,000-pixel-per-axis ceiling. Animated inputs are rejected. Accepted images are orientation-corrected,
bounded to 2,400 pixels per axis without enlargement, converted to sRGB, stripped of metadata, and
encoded as optimized WebP with a 5 MB delivery ceiling. Only the transformed bytes are uploaded,
under an unguessable relative
`catalog/YYYY/MM/<uuid>.webp` key. Their SHA-256 is recorded in Blob metadata and the audit event.

Every created database row is explicitly `UNVERIFIED`, `isPrimary=false`, and has no rights approval
or evidence. Uploading never publishes or approves anything; if unresolved media would invalidate an
already published product, the existing publication invariant returns it to draft and rechecks its
brand. Blob persistence happens before the serializable metadata transaction, so any transaction
failure triggers bounded Blob deletion retries. Alert on the `media_upload_cleanup_failed` notice and
run the orphan reconciler/lifecycle policy before retrying because a network failure can make storage
outcomes ambiguous.

## Admin and export permissions

`/admin/enquiries` and each mutation revalidate the Auth.js session against an active `AdminUser` and a hashed, revocable `AdminSession`. Staff can view/update enquiries, add encrypted notes, and schedule encrypted follow-ups. Only `OWNER` and `ADMIN` roles can call the filtered CSV export. CSV excludes clinical narrative, neutralizes spreadsheet formulas, caps exports at 5,000 rows, sends `no-store`, and creates an append-only audit record.

The migration installs a database trigger that rejects updates/deletes to `AuditLog`. Business-profile publication also has a database constraint requiring an approver and approval timestamp. Google snapshot/review caches have database-enforced maximum 30-day TTLs.

## Owner-controlled offers and commercial programs

`/admin/offers` is readable by active Owner and Admin accounts; only the active Owner can create or
change drafts, map eligibility, or enable/disable a program. V1 accepts only these reviewed slug and
canonical-path pairs:

- `50-percent-off` → `/offers/50-percent-off`
- `hearing-aid-rental` → `/hearing-aid-rental`
- `care-plans` → `/care-plans`
- `hearing-aid-trial` → `/hearing-aid-trial`

Any edit to facts or mappings automatically disables the record and requires a new explicit Owner
approval. Each mutation is written to the append-only audit log. Public loading also requires a
current `offer.owner_enabled` audit event, created after the record's latest update by an active Owner;
that event is bound to the exact approved `Offer.updatedAt` revision. The database `enabled` flag
alone is not publication authority. Records enabled by an older implementation without this revision
evidence stay withheld until the Owner reviews and enables them again.

Enablement requires the exact reviewed landing page, ordered start/end instants, a substantive
summary, complete written terms, and at least one exact product or service. Terms must use explicit
`Pricing:`, `Deposit:`, `Warranty:`, `Trial applicability:`, `Eligibility:`, and `Dates:` clauses;
`not applicable` is acceptable only when it is the approved fact. A brand mapping alone never
establishes eligibility. Mapped products must be published and pass all catalog source/media-rights
gates; mapped services and optional brands must be published and Owner-source-verified. The
`50-percent-off` campaign must record exactly `50` as its maximum discount, use the bounded public
title `Eligible for Up to 50% Off`, map at least one exact approved device, map no services, and pass
the complete approved-catalog gate. Rental, care-plan and trial programs must store
`maximumDiscountPct=null`, and their public views never render discount language. Publication also
rejects positive stock, scarcity, countdown, guarantee, and risk-free claims in public program copy.

Public program queries independently re-run the gate, current Owner-approval evidence and date window
on every request. Any product-backed record also requires the complete four-brand database catalog
snapshot and `CATALOG_PUBLICATION_ENABLED=true`; the Owner enable flag is not an override. Because
`/hearing-aid-trial` is already a catalog-protected route, it always requires that same complete
approved catalog even when its exact mapping contains only services. Staged catalog preview remains
separate: it cannot activate a trial program. The existing proxy gate is not bypassed. The site shows
no offer, rental, care plan, trial, discount, eligible item, or terms when any applicable database,
approval, date, mapping, media-rights, or catalog gate is incomplete.

## Legacy migration

Both Azure Table and NDJSON imports are dry-run by default and compute a deterministic source hash/count audit without printing patient rows:

```text
npm run enquiries:import -- --file data/enquiries.ndjson
npm run enquiries:import -- --azure
```

After the owner verifies the source hash and counts, commit idempotently:

```text
npm run enquiries:import -- --file data/enquiries.ndjson --commit --approved-by owner@example.com
npm run enquiries:import -- --azure --commit --approved-by owner@example.com
```

The approving account must already be the active configured `OWNER`. Legacy `(partitionKey,rowKey)` values produce a unique idempotency hash, so reruns report duplicates instead of creating additional enquiries or emails. Imports never enqueue notifications to historical patients. A completed commit writes its source hash and counts to `AuditLog`.

## Retention

Retention is also dry-run first:

```text
npm run retention:run
npm run retention:run -- --commit --confirm-retention --approved-by owner@example.com
```

The job selects spam after 30 days and other unconverted enquiries after
`ENQUIRY_RETENTION_MONTHS` from `updatedAt` (default 24 months, allowed 6–120); converted enquiries
are not included. It removes sent email 30 days after `sentAt`, dead email 30 days after its last
update, private attachments 90 days after a `CLOSED` enquiry's last update, and every private
attachment at 12 months when no structured hold exists. Exact `quarantine/` or `clean/` Blob keys
are deleted before their database rows. Expired temporary Google data, revoked sessions, and
expired/rejected/unclaimed uploads remain covered. The append-only audit contains only policy/cutoff
metadata, counts, and hashes. Validate legal policy, backups, Blob soft-delete recovery, and the dry
run before every Owner-approved commit.

The current schema has no retention-hold record. Consequently, a note or free-text field cannot
silently exempt a file from the 12-month maximum. If legal review requires a documented hold, keep
the production job disabled until a structured, expiring, Owner-audited hold model and exclusion test
are deployed.

## Required CI and operations

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit`, `prisma validate`, and migration validation in CI. Monitor database availability, rate limiting at the edge, Turnstile failures, outbox age/dead jobs, upload scan latency/errors, Google TTL cleanup, auth denial spikes, and retention completion. Do not send health details, messages, phone numbers, emails, or references to analytics/log aggregation.
