# Product media publication gate

No hearing-aid product image in the repository is approved for public commercial use yet.
Catalog components must keep product media hidden while `rightsStatus` is `pending` or
`publicUseApproved` is false.

The manufacturer pages used to verify model names and factual feature claims are recorded in
[`catalog-source-register.md`](./catalog-source-register.md). Those links establish neither image
rights nor Audiosen inventory, availability, pricing, or a commercial relationship.

Before any model image is enabled, record all of the following:

- the exact asset and source URL;
- the commercial-use licence or written permission;
- retained evidence and any attribution requirements;
- owner inventory approval for the corresponding public model;
- accurate alternative text and the approval date.

Editorial hearing-device imagery may be used only where its own rights are documented and where it
cannot reasonably be read as a photograph of a named catalog model.

## Retired legacy review inputs

Files below `/images/products/`, manufacturer marks below `/brands/`, and the former
`/images/services/hearing-aid-trial.jpg` composite have no recorded public-use approval. They are
unlinked and denied by the application edge (including through Next image optimization) while they
remain review inputs. Production rollout must also purge any older CDN cache entries for them.

## Generic 3D hero fallback

- Source: generated for this Audiosen rebuild with OpenAI image generation on 2026-08-22.
- Source asset: `/images/3d/generic-ric-fallback-v1.png`.
- Optimized public fallback: `/images/3d/generic-ric-fallback-v1.webp` (1254×1254, transparent,
  124,754 bytes).
- Prompt intent: a brand-neutral receiver-in-canal hearing-device visualization in navy, teal and
  pearl, isolated on transparency, without logo, text, model identity, clinical claim or watermark.
- Boundary: this is an educational generic visualization, not a manufacturer model, inventory
  photograph, fitting recommendation or evidence of a commercial relationship.
