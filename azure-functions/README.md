# Audiosen email outbox Azure Function

This package deploys the existing transactional outbox processor as an Azure Functions v4 Node.js
timer. It does not contain a second claim, retry, or ACS implementation: both the CLI worker and this
Function call `processEmailOutboxBatch()` from `../lib/email-outbox-worker.ts`. The database remains
the concurrency boundary, so an overlapping timer invocation can only claim an unchanged, unlocked
row once.

The Function runs one bounded batch (at most 20 candidates) per invocation, recovers locks older than
ten minutes, preserves independent staff/patient retries, and uses the outbox UUID as the ACS operation
ID. `runOnStartup` is deliberately false and schedule monitoring is enabled. Health routes never send
mail and return only `ok` plus a fixed service name.

## Fail-closed settings

Deploy with `EMAIL_OUTBOX_WORKER_ENABLED=false`, configure and validate every dependency, then change
it to the exact lower-case value `true`. A missing or invalid setting stops the batch before it opens
PostgreSQL or constructs an ACS client.

| Setting | Required contract |
| --- | --- |
| `EMAIL_OUTBOX_WORKER_ENABLED` | Exact `true` only after staging approval; every other value is disabled. |
| `EMAIL_OUTBOX_TIMER_SCHEDULE` | Six-field NCRONTAB, normally `0 * * * * *` (once per minute). |
| `DATABASE_URL` | TLS-required PostgreSQL URL supplied through an Azure Key Vault reference. The runtime identity/database role needs only the outbox DML required by the shared processor. It never migrates schema. |
| `AZURE_COMMUNICATION_EMAIL_SENDER` | Exact verified sender `support@audiosen.com`. |
| `AZURE_COMMUNICATION_EMAIL_ENDPOINT` | Credential-free HTTPS ACS resource origin for managed identity. |
| `AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING` | Key Vault supplied fallback only. Configure this or the endpoint, never both. |
| `FUNCTIONS_WORKER_RUNTIME` | `node`. |
| `FUNCTIONS_NODE_BLOCK_ON_ENTRY_POINT_ERROR` | `true`, so indexing errors are fatal and visible. |
| `AzureWebJobsStorage__accountName` | Recommended identity-based host storage account. A secret connection string in `AzureWebJobsStorage` is also understood by the host. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Dedicated operational telemetry; do not add email bodies, recipients, enquiry references, or query strings as dimensions. |
| `NODE_ENV` | `production`. |

Prefer a system- or user-assigned managed identity for ACS and Functions host storage. Grant only the
resource/data-plane roles required by the selected services, use private PostgreSQL networking, and
keep the connection-string fallback in Key Vault. Azure Functions needs host storage for timer
coordination even though email jobs live in PostgreSQL.

The host resolves `%EMAIL_OUTBOX_TIMER_SCHEDULE%` while indexing. A missing schedule can therefore
prevent the host from loading, which is intentional. The runtime configuration check is a second
guard. It also rejects Azurite when `WEBSITE_HOSTNAME` proves the process is running in Azure.

## Validation (never sends email)

From this directory:

```text
npm ci
npm run verify
```

Tests inject a fake batch processor and database probe. `verify` type-checks the wrapper, validates
that the root CLI still imports the shared processor, confirms the canonical Prisma outbox fields,
generates Prisma Client, and creates `dist/index.js`. It does not invoke `sendQueuedEmail`, insert an
outbox row, or contact PostgreSQL/ACS.

Local Functions-host testing requires Azurite and a disposable migrated PostgreSQL fixture. Copy
`local.settings.example.json` to the ignored `local.settings.json`, keep
`EMAIL_OUTBOX_WORKER_ENABLED=false`, and run `npm start` to inspect indexing and the health response.
Do not enable delivery locally with production ACS or patient data.

## Production build and deployment

This is a monorepo adapter: esbuild includes the shared files from `../lib`, and Prisma Client is
generated from `../prisma/schema.prisma`. Azure remote build receives only this Function directory and
therefore cannot safely resolve those parents. Build the deployable artifact from a full checkout on
Linux x64 with Node.js 22—the same platform/major configured on the Function app:

```text
cd azure-functions
npm ci
npm run verify
npm run deploy:check
npm prune --omit=dev
node -e "require('@prisma/client').PrismaClient; require('./dist/index.js')"
func azure functionapp publish <FUNCTION_APP_NAME> --no-build
```

Do not build the deployable `node_modules` on Windows or macOS: Prisma includes a native query engine,
and a mismatched local build is not a valid Linux Function package. Do not use
`--build-remote=true` for this monorepo wrapper. The committed lockfile, generated JavaScript,
production dependencies, root-level `host.json`, and `package.json.main` form the deployment unit.

Use an Azure staging Function app and non-production PostgreSQL/ACS resources first. Apply the
canonical web-app Prisma migrations before enabling the worker. The Function identity must not have
DDL/migration permission. Once the synthetic staging outbox reaches `SENT` and records the ACS IDs,
switch the production setting to `true`; never use a real patient narrative for a smoke test.

Microsoft's current Functions guidance recommends local builds for complex monorepos, requires the
build platform to match Linux x64 for native dependencies, and documents `--no-build` for publishing
precompiled output: <https://learn.microsoft.com/en-us/azure/azure-functions/typescript-build-options>.
Timer schedules and `runOnStartup: false` follow the official timer-trigger guidance:
<https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer>.

## Health, alerts, and rollback

`GET /api/health/outbox` is intentionally anonymous so Azure Health Check can call it. It validates
the kill switch and configuration in memory, but does not open PostgreSQL or contact ACS. Configure
the Function app health-check path to this route and restrict direct ingress where the hosting plan
permits.

`GET /api/health/outbox/readiness` additionally runs `SELECT 1` and requires a Function key. Call it
from a protected Azure Monitor availability test using the `x-functions-key` header; do not put the
key in a query string or log it. Neither route reports which dependency failed. A readiness `200`
proves configuration plus PostgreSQL reachability, not ACS sender or delivery readiness.

Alert on:

- no successful `Email outbox batch completed.` trace for five minutes while enabled;
- any `DEAD` row, repeated `FAILED` rows, or oldest ready row older than 15 minutes;
- `staleLocksRecovered > 0`, health `503`, timer past-due warnings, or Function timeouts;
- ACS authentication/throttling failures and PostgreSQL connection exhaustion.

Logs contain bounded counters, error classes/codes, outbox UUIDs, and job kind only. They must never
gain recipients, subjects, bodies, patient details, enquiry references, database URLs, or ACS secrets.

For immediate rollback, set `EMAIL_OUTBOX_WORKER_ENABLED=false` and restart the Function app. Queued
rows remain in PostgreSQL. Do not delete or bulk-reset them. Diagnose provider/database state, then
re-enable the same release; stale `PROCESSING` locks recover after ten minutes. Only use the admin's
explicit retry action for reviewed `FAILED`/`DEAD` jobs.
