# Audiosen lead-retention runbook

Owner: Audiosen founder or a specifically authorised operations administrator.

Review cadence: quarterly, and at least once every 12 months.

Scope: entities in the Azure Table Storage table named by `AZURE_TABLE_NAME` (currently
`AudiosenLeads`). Access must use Microsoft Entra identity and the narrowest practical
`Storage Table Data Contributor` assignment. Do not create or circulate account keys.

## Regular review

1. Use Azure Storage Browser or an approved Entra-authenticated administration tool to list
   records whose last meaningful interaction is more than 24 months old.
2. Exclude an entity when it is connected to an active service, warranty, transaction, dispute,
   fraud-prevention review, deletion hold, or applicable record-keeping requirement.
3. Review the candidate count and row identifiers before deletion. Do not place names, phone
   numbers, hearing details, or message text in review notes.
4. Delete only the approved entities by exact `PartitionKey` and `RowKey`.
5. Record the review date, reviewer, candidate count, exclusion count, deletion count, and the
   next review date in the private operations log. The log must not contain lead content.

## Data-subject request

1. Receive the request through `support@audiosen.com` or another verifiable contact channel.
2. Verify that the requester controls the relevant email address or phone number before exposing,
   changing, or deleting a record.
3. Search narrowly, document any applicable retention exception, and complete the approved action.
4. Confirm completion to the requester without including unnecessary personal or hearing-health
   information.

## Failure handling

- If table access or a deletion fails, stop the run and record the technical error without lead data.
- Never weaken the storage firewall, enable anonymous access, or paste a storage key into a local
  script to finish a retention run.
- Escalate ambiguous medical, transaction, warranty, dispute, or legal-retention cases before
  deleting the record.
