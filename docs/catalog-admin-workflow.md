# Catalog draft and approval workflow

`/admin/catalog` is the database catalog control surface. Active `OWNER` and `ADMIN` accounts may
read it; only an active `OWNER` may submit a mutation. Each write performs the Owner lookup again
inside the same serializable PostgreSQL transaction as the catalog change and append-only
`AuditLog` insert. A stale session, deactivated account, role change, or email mismatch fails closed.

## Draft creation

- A new brand requires a stable lowercase slug, display name, optional description, and sort order.
  It is created with `isPublished=false` and no source approval.
- A new model requires its parent brand, a stable lowercase slug, model name, controlled device
  style, and sort order. It is created as `DRAFT`, is not featured, requires consultation, has no
  source approval, and records every controlled feature as `unknown`.
- Creation never confirms a manufacturer source, approves media rights, selects primary media,
  publishes a row, or enables the public catalog runtime.
- Slugs are intentionally absent from edit actions and forms. Correcting an identifier requires a
  separately reviewed migration, not an ordinary content edit.

## Factual edits and structured values

Owners can update brand copy/order and model facts including summary, suitable use, device style,
rechargeable/Bluetooth/streaming tri-state values, app information, hearing-loss suitability, noise
management, warranty, fitting information, after-care, repair support, consultation requirement,
non-transactional price guidance, feature ordering, featured ordering, and sort order.

The `features` JSON object always contains the controlled keys below with one of `yes`, `no`, or
`unknown`. Keep a value `unknown` until an exact source establishes it.

- `rechargeable`
- `bluetoothStreaming`
- `auracast`
- `appControl`
- `crosSupport`
- `pediatricPath`
- `powerFormat`
- `customFit`

`specifications` accepts a JSON object only. Nested objects and arrays are allowed, but stock,
inventory, current-availability, and fulfilment fields or promises are rejected. The same claim
policy applies to editable public-facing copy. This catalog does not represent inventory and must
not imply that a model is presently available to purchase, ready to ship, or held in stock.

Every factual edit has conservative invalidation semantics:

- brand edits clear `verifiedAt`/`verifiedBy` and set `isPublished=false`;
- model edits clear `verifiedAt`/`verifiedBy`;
- an edited non-archived model returns to `DRAFT`;
- an edited archived model remains `ARCHIVED`;
- the parent brand publication gate is recalculated and the brand is automatically unpublished if
  it no longer has an Owner-confirmed source and four gate-passing published models.

The exact prior source URL remains visible as a review aid, but it is not approved again until an
Owner performs the explicit source-confirmation action.

## Recoverable lifecycle

Archiving changes a model to `ARCHIVED`; it does not delete facts, source history, media,
provenance, or audit records. Restoring changes only an archived model to `DRAFT`. Restoration never
publishes it. Publication remains a separate, explicitly confirmed Owner action and still requires
the complete source and media gate.

## Audit events

Draft management writes these append-only events in the mutation transaction:

- `catalog.brand_draft_created`
- `catalog.brand_details_updated`
- `catalog.product_draft_created`
- `catalog.product_details_updated`
- `catalog.product_archived`
- `catalog.product_restored_to_draft`
- `catalog.product_auto_drafted` when another controlled change invalidates a published model
- `catalog.brand_auto_unpublished` when a dependent brand gate becomes incomplete

Audit metadata records identifiers, state transitions, affected field names, and approval-removal
flags; it does not duplicate the edited public copy. Database controls make `AuditLog` update and
delete operations fail. Any catalog or audit write failure rolls back the transaction.

## Owner operating sequence

1. Create the brand/model as a draft and enter only sourced facts. Use `unknown` rather than an
   inference.
2. Upload optimized product media through the separate unverified media intake.
3. Review exact product and brand source URLs, then explicitly confirm them.
4. Record media-rights evidence and select one gate-passing primary image.
5. Publish the model only when its displayed gate passes.
6. Publish the brand only after its source gate and the four-model minimum pass.
7. Treat any later factual edit as a new approval cycle; never work around the automatic draft or
   unpublish transition.

These database decisions do not enable the public runtime flag, alter routes, or add sitemap URLs.
