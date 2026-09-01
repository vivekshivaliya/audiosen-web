import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../../lib/email-outbox-worker.ts", import.meta.url), "utf8");
const command = await readFile(new URL("../../scripts/process-email-outbox.ts", import.meta.url), "utf8");
const schema = await readFile(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

assert.match(worker, /export async function processEmailOutboxBatch/u);
assert.match(worker, /sendQueuedEmail/u);
assert.match(worker, /EmailOutboxStatus\.PROCESSING/u);
assert.match(worker, /lastErrorCode: "stale_lock"/u);
assert.match(command, /processEmailOutboxBatch/u);
assert.doesNotMatch(command, /emailOutbox\.(findMany|update|updateMany)/u);

const outboxModel = schema.match(/model EmailOutbox \{[\s\S]*?\n\}/u)?.[0];
assert.ok(outboxModel, "EmailOutbox must remain present in the canonical Prisma schema.");
for (const field of [
  "status",
  "attemptCount",
  "maxAttempts",
  "nextAttemptAt",
  "lockedAt",
  "providerMessageId",
  "providerStatus",
]) {
  assert.match(outboxModel, new RegExp(`\\n\\s+${field}\\s`, "u"));
}

const contractHash = createHash("sha256")
  .update(outboxModel)
  .update(worker)
  .digest("hex")
  .slice(0, 16);
console.info(`Shared outbox contract verified (${contractHash}).`);
