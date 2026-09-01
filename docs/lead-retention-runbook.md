# Audiosen website-data retention runbook

Owner: Audiosen Owner or a specifically authorised Admin.

Review cadence: monthly automated jobs, quarterly sampled review, and at least one full annual review.

Scope: the website CRM in Azure Database for PostgreSQL, the private Azure Blob attachment
containers, the transactional email outbox, short-lived Google Business snapshots, and the
read-only Azure Table/owner-approved NDJSON migration sources. This CRM is not a clinical-record
system.

## Default schedules

- Suspected spam: delete or irreversibly anonymise after 30 days.
- Unconverted website enquiries: 24 months after the last meaningful activity.
- Private attachments: 90 days after enquiry closure; no longer than 12 months without a
  documented, approved operational need.
- Successfully delivered email-outbox bodies: 30 days. Delivery metadata may be retained longer
  when required for troubleshooting, audit, or law, without retaining sensitive message bodies.
- Raw Google Business snapshots: no more than 30 days.
- Quarantined, unclaimed, rejected, or orphaned uploads: remove on the short expiry recorded with
  the upload; do not promote them into a public container.
- Azure Table and approved NDJSON migration sources: read-only for 30 days after count and sample
  hash reconciliation, then apply the separately approved source-retention action.

These defaults do not override an applicable legal minimum or a documented hold for an active
service, transaction, dispute, security investigation, fraud prevention, grievance, warranty, or
other lawful purpose. Obtain Indian legal review before production enforcement.

## Automated retention job

1. Run with a dedicated managed identity and least-privilege database/blob permissions.
2. Select candidates by opaque IDs and timestamps. Never write names, phones, emails, narratives,
   file names, enquiry references, or file claim tokens to job logs.
3. Exclude documented holds and active records transactionally.
4. Delete private Blob objects before removing the final attachment record, retrying failures
   without exposing the storage path publicly.
5. Delete or anonymise the approved database records and append a non-PII audit event containing
   policy version, category, candidate count, exclusion count, completion count, failure count,
   actor/job identity, and timestamp.
6. Alert an Owner when any category repeatedly fails; do not silently extend retention.

The current database does not yet contain a structured retention-hold record. The automated job
therefore applies the 12-month private-attachment maximum with no note-based exception. If a lawful
hold is required, disable the commit job until an expiring, Owner-audited hold model and tested
exclusion are deployed; an ordinary CRM note is not a safe retention control.

## Existing lead migration and source retirement

1. Import Azure Table and owner-approved local NDJSON records idempotently using a stable source
   identity/hash. Never copy arbitrary development data into production.
2. Compare source and destination counts by approved partition/batch and validate a small sample of
   canonical hashes without placing raw patient data in the report.
3. Record reconciliation approval in the audit log.
4. Keep the source read-only for 30 days after approval. No new public form may write to it.
5. After the 30-day window, execute only the Owner-approved retention action for each source and
   record the outcome. Local plaintext files must not remain on developer machines as a backup.

## Data-principal request and consent withdrawal

1. Receive the request through `support@audiosen.com` or another verifiable contact channel.
2. Verify control of the relevant email or phone before exposing, correcting, exporting, or
   deleting data. For a child, complete the applicable parent/lawful-guardian verification.
3. Search narrowly. Keep identity-verification material out of general enquiry notes.
4. Record any legal/operational retention exception with a reason and review date.
5. Complete the approved access, correction, withdrawal, or deletion action across PostgreSQL,
   private Blob storage, pending outbox bodies, and eligible processor copies.
6. Confirm completion without returning unnecessary health content or internal identifiers.

## Failure and security handling

- Stop a destructive batch when resolved targets do not match the reviewed candidate set.
- Never weaken a database/storage firewall, enable anonymous Blob access, reuse public product
  media for patient files, or paste a storage/database key into a local script.
- Do not delete append-only audit evidence through the ordinary admin UI; protect it with database
  permissions and a separately reviewed policy.
- Redact all errors. Escalate suspected exposure or unauthorised access through the incident process.
- Review this runbook against the current official DPDP Act/Rules and notified commencement
  timetable: <https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa>.
