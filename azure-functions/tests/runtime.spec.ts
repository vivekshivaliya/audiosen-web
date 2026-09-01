import assert from "node:assert/strict";
import test from "node:test";
import {
  type EmailOutboxBatchResult,
  evaluateOutboxHealth,
  evaluateOutboxLiveness,
  executeOutboxTimer,
  type OperationalLogger,
} from "../src/runtime";

function readyEnvironment(): Record<string, string> {
  return {
    EMAIL_OUTBOX_WORKER_ENABLED: "true",
    DATABASE_URL: "postgresql://worker:secret@postgres.internal:5432/audiosen?sslmode=require",
    AZURE_COMMUNICATION_EMAIL_SENDER: "support@audiosen.com",
    AZURE_COMMUNICATION_EMAIL_ENDPOINT: "https://audiosen.communication.azure.com",
    EMAIL_OUTBOX_TIMER_SCHEDULE: "0 * * * * *",
    FUNCTIONS_WORKER_RUNTIME: "node",
    AzureWebJobsStorage__accountName: "audiosenfunctionstorage",
  };
}

function logger() {
  const events: Array<{ level: string; message: string; details?: Record<string, unknown> }> = [];
  const context: OperationalLogger = {
    log: (message, details) => events.push({ level: "log", message, details }),
    warn: (message, details) => events.push({ level: "warn", message, details }),
    error: (message, details) => events.push({ level: "error", message, details }),
  };
  return { context, events };
}

const emptyBatch: EmailOutboxBatchResult = {
  claimed: 0,
  delivered: 0,
  failed: 0,
  dead: 0,
  staleLocksRecovered: 0,
};

test("an unready timer invocation never calls the outbox processor", async () => {
  const { context, events } = logger();
  let calls = 0;
  await assert.rejects(
    executeOutboxTimer({}, context, {}, async () => {
      calls += 1;
      return emptyBatch;
    }),
    /configuration is not ready/u,
  );
  assert.equal(calls, 0);
  assert.equal(events.at(-1)?.level, "error");
});

test("a ready timer invokes exactly one shared batch and logs bounded counters", async () => {
  const { context, events } = logger();
  let calls = 0;
  await executeOutboxTimer({ isPastDue: true }, context, readyEnvironment(), async () => {
    calls += 1;
    return { ...emptyBatch, claimed: 2, delivered: 2 };
  });
  assert.equal(calls, 1);
  assert.ok(events.some((event) => event.level === "warn" && event.message.includes("past due")));
  const completion = events.find((event) => event.message === "Email outbox batch completed.");
  assert.deepEqual(completion?.details?.claimed, 2);
  assert.equal(Object.hasOwn(completion?.details ?? {}, "recipient"), false);
});

test("health returns no configuration details and skips the probe when disabled", async () => {
  const { context } = logger();
  let probes = 0;
  const result = await evaluateOutboxHealth(context, {}, async () => {
    probes += 1;
  });
  assert.equal(probes, 0);
  assert.deepEqual(result, {
    status: 503,
    jsonBody: { ok: false, service: "audiosen-email-outbox-worker" },
  });
});

test("anonymous liveness checks configuration without opening a database connection", () => {
  const { context } = logger();
  assert.deepEqual(evaluateOutboxLiveness(context, readyEnvironment()), {
    status: 200,
    jsonBody: { ok: true, service: "audiosen-email-outbox-worker" },
  });
  assert.equal(evaluateOutboxLiveness(context, {}).status, 503);
});

test("health probes PostgreSQL without sending mail", async () => {
  const { context } = logger();
  let probes = 0;
  const result = await evaluateOutboxHealth(context, readyEnvironment(), async () => {
    probes += 1;
  });
  assert.equal(probes, 1);
  assert.equal(result.status, 200);
  assert.equal(result.jsonBody.ok, true);
});

test("health converts database failures into a generic 503", async () => {
  const { context } = logger();
  const result = await evaluateOutboxHealth(context, readyEnvironment(), async () => {
    throw new Error("internal database details that must not be returned");
  });
  assert.deepEqual(result, {
    status: 503,
    jsonBody: { ok: false, service: "audiosen-email-outbox-worker" },
  });
});
