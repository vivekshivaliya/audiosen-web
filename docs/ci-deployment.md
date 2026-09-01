# CI, SEO staging, and production promotion

The workflow in `.github/workflows/master_audiosen-vivek.yml` validates every pull request and
`master` push. A push or manual run deploys the exact tested standalone artifact to the real Azure
App Service slot `audiosen-vivek/seo-staging`. Production is never deployed directly from a push: a
maintainer must start `workflow_dispatch`, set `promote_production` to `true`, and pass the protected
`production` environment approval before the verified slot is swapped.

The workflow deploys and swaps application content; it deliberately does not create, resize, stop,
or delete Azure resources. Complete the one-time platform setup below before enabling the workflow.

## Fixed Azure release contract

The SEO release is pinned to these reviewed, non-secret values:

- resource group `audiosen-rg1`
- App Service plan `ASP-audiosenrg1-aba0`, Standard `S1`
- Linux web app `audiosen-vivek`
- deployment slot `seo-staging`
- staging origin: the exact regionalized `defaultHostName` Azure assigns to `seo-staging`
- production origin `https://audiosen.com`

Standard S1 is required because Basic B1 does not support deployment slots. As a one-time,
authorized infrastructure operation, upgrade the existing plan and create the slot by cloning the
production configuration:

```text
az appservice plan update --resource-group audiosen-rg1 --name ASP-audiosenrg1-aba0 --sku S1
az webapp deployment slot create --resource-group audiosen-rg1 --name audiosen-vivek --slot seo-staging --configuration-source audiosen-vivek
```

Configure production and `seo-staging` for Node 22 LTS, startup command `node server.js`, Always On,
HTTPS Only, HTTP/2, minimum TLS 1.2, and App Service Health Check `/api/health`. Keep auto-swap off
and staging traffic at zero. The workflow refuses to deploy if the web app is not attached to the
named S1 plan or if `seo-staging` is not a true slot. Do not infer the slot hostname from the app and
slot names: this App Service uses a regionalized Azure hostname. After creating the slot, obtain its
exact origin and save it as the repository variable `AZURE_STAGING_URL`:

```text
az webapp show --resource-group audiosen-rg1 --name audiosen-vivek --slot seo-staging --query defaultHostName --output tsv
```

## GitHub configuration

Create `staging` and `production` environments. Restrict both to `master`. Configure a required
reviewer on `production`; staging may deploy automatically after the CI gates. A single-maintainer
repository may temporarily allow that owner to approve their own manually requested promotion.
Enable prevent-self-review as soon as a second trusted maintainer is available. Resource names and
the production origin are pinned in the workflow. The staging origin is
the only target value supplied as a repository variable, and the workflow rejects it unless it
exactly matches the `seo-staging` slot hostname returned by Azure.

Required non-secret repository variables (identifiers only; OIDC supplies the short-lived token):

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Required repository variable:

- `AZURE_STAGING_URL`, set to `https://` plus the exact `defaultHostName` returned by Azure, with no
  path or trailing slash

Optional repository variables compiled into the standalone artifact:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, when the existing public enquiry flow requires Turnstile
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, only when the approved GA4 property is ready

Configure a GitHub Actions federated identity for each environment and grant only the App Service
read, slot deployment, app-setting, and swap permissions needed for this web app and resource group.
The workflow requests `id-token: write` only in the two Azure jobs and uses OIDC; do not create a
publish-profile secret. Protect the production environment with a required reviewer; use an
independent reviewer when the repository has one. Keep database, email, encryption, Blob, Google, and Turnstile secrets in Azure App
Service settings. `NEXT_PUBLIC_*` values are build-time inputs, so changing one requires a newly
validated artifact rather than an App Service restart.

Both slots must expose liveness at `/api/health` over HTTPS. This SEO-only promotion does not call
the broader dependency-readiness endpoint and therefore does not require unfinished admin, email,
upload, catalog, or Google integrations. Staging must be reachable from GitHub-hosted runners for
Playwright and the ZAP baseline. CI and the staging slot keep public enquiries disabled, so release
validation does not create leads or send messages.

Before every staging deployment, the workflow sets these values as deployment-slot settings so they
cannot move into production during a swap:

- `AUDIOSEN_STAGING_DEPLOYMENT=true`
- `AUDIOSEN_STAGING_HOST=<the defaultHostName discovered from Azure>`
- `PUBLIC_ENQUIRIES_ENABLED=false`
- `CATALOG_STAGING_PREVIEW_ENABLED=false`

Production keeps `AUDIOSEN_STAGING_DEPLOYMENT=false`. Never remove the slot-setting designation
from the staging flags: the application uses them to emit `X-Robots-Tag: noindex, nofollow`, block
all crawling in `robots.txt`, omit the sitemap declaration, and reject any other Azure hostname.

## Gates

The quality job runs a clean install, high-severity dependency audit, Prisma generation/validation/migration deployment and drift checks, content and analytics privacy guards, lint, typecheck, unit/component tests, jsdom axe smoke, production build, the lazy Three.js bundle budget, Playwright across Chromium/Firefox/WebKit and the nine required widths, browser axe, same-origin link crawling, JSON-LD checks, and Lighthouse CI. It also clean-installs, typechecks, tests, bundles, and audits the independently deployable Azure Function email worker; Function deployment remains a separate protected infrastructure operation.

The lazy hearing-device scene may total at most 256,000 gzip bytes. Its loader remains in the homepage entry, while the Three.js scene chunk must remain outside all initial homepage scripts. Lighthouse reports remain private workflow artifacts; no temporary public upload is used.

The separate secret job scans full Git history with a digest-pinned Gitleaks container and uploads
only a redacted SARIF artifact. After the build passes, the workflow records SHA-256 checksums,
uploads one standalone artifact named for the commit, downloads that artifact, and verifies every
file before deployment. Production receives those exact bytes only through a slot swap; no second
build or direct production deployment is allowed.

After staging deployment, `/api/health`, the browser smoke suite, and OWASP ZAP must pass. The smoke
suite confirms that staging pages return noindex/nofollow in headers and metadata, and that
`robots.txt` blocks `/` without advertising a sitemap. The local schema gate checks the canonical
business entity, priority canonicals, sitemap membership, and the permanent home-care redirect.

After the manually approved swap, production must pass liveness and the minimum SEO checks:
indexable homepage, crawlable `robots.txt` with the canonical sitemap, valid sitemap XML containing
the Dehradun hearing-aids URL, and a 308 redirect from `/home-hearing-care-dehradun` to
`/home-hearing-care`. It then confirms that the former production artifact now in `seo-staging`
either retains noindex plus a crawl-blocking `robots.txt`, or redirects only to the canonical
production origin. Any failure immediately swaps `seo-staging` and production back and fails the
promotion. Because workflow concurrency never cancels an in-progress run, a later push cannot
interrupt a protected swap or rollback.

Useful local equivalents are:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run test:a11y:unit
npm run build
npm run qa:bundle
npm run qa:migration
npm run qa:content
npm run test:e2e
npm run test:a11y:e2e
npm run test:links
npm run test:schema
npm audit --audit-level=high
npm ci --prefix azure-functions
npm --prefix azure-functions run verify
npm --prefix azure-functions audit --audit-level=high
```

## External deployment checks

The workspace-level file `C:\Users\vivek\audiosen\cloudflare-audiosen-mailcow.zone` is outside this repository and describes the legacy Mailcow DNS arrangement. Treat it as a migration artifact only; it must be owner-reviewed and retired or archived when Cloudflare Email Routing and ACS records are approved. The workflow deliberately does not modify DNS.

Before enabling public uploads, deploy the quarantine scan/metadata-strip worker and its deletion path. Before enabling enquiries, provision PostgreSQL, the approved encryption key version, Turnstile, ACS Email, and the outbox worker. These runtime launch gates are intentionally not replaced with test credentials or fallbacks in CI.
