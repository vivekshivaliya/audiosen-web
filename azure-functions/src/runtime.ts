import { evaluateWorkerConfiguration } from "./config";

const SERVICE_NAME = "audiosen-email-outbox-worker";

type Environment = Record<string, string | undefined>;

export type OperationalLogger = {
  log(message: string, details?: Record<string, unknown>): void;
  warn(message: string, details?: Record<string, unknown>): void;
  error(message: string, details?: Record<string, unknown>): void;
};

export type EmailOutboxBatchResult = {
  claimed: number;
  delivered: number;
  failed: number;
  dead: number;
  staleLocksRecovered: number;
};

type BatchProcessor = () => Promise<EmailOutboxBatchResult>;
type ReadinessProbe = () => Promise<void>;

async function sharedBatchProcessor(): Promise<EmailOutboxBatchResult> {
  const worker = await import("../../lib/email-outbox-worker.js");
  return worker.processEmailOutboxBatch();
}

async function sharedReadinessProbe(): Promise<void> {
  const worker = await import("../../lib/email-outbox-worker.js");
  await worker.probeEmailOutboxDatabase();
}

export async function executeOutboxTimer(
  timer: { isPastDue?: boolean },
  context: OperationalLogger,
  environment: Environment = process.env,
  processBatch: BatchProcessor = sharedBatchProcessor,
): Promise<void> {
  const configuration = evaluateWorkerConfiguration(environment);
  if (!configuration.ready) {
    context.error("Email outbox worker configuration is not ready.", {
      issueCodes: configuration.issues,
    });
    throw new Error("Email outbox worker configuration is not ready.");
  }

  if (timer.isPastDue) {
    context.warn("Email outbox timer invocation is past due.");
  }

  const startedAt = Date.now();
  try {
    const result = await processBatch();
    context.log("Email outbox batch completed.", {
      claimed: result.claimed,
      delivered: result.delivered,
      failed: result.failed,
      dead: result.dead,
      staleLocksRecovered: result.staleLocksRecovered,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    context.error("Email outbox batch stopped before completion.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("Email outbox batch stopped before completion.");
  }
}

export async function evaluateOutboxHealth(
  context: OperationalLogger,
  environment: Environment = process.env,
  probe: ReadinessProbe = sharedReadinessProbe,
): Promise<{ status: 200 | 503; jsonBody: { ok: boolean; service: string } }> {
  const configuration = evaluateWorkerConfiguration(environment);
  if (!configuration.ready) {
    context.warn("Email outbox health check is not ready.", {
      issueCodes: configuration.issues,
    });
    return { status: 503, jsonBody: { ok: false, service: SERVICE_NAME } };
  }

  try {
    await probe();
    return { status: 200, jsonBody: { ok: true, service: SERVICE_NAME } };
  } catch (error) {
    context.warn("Email outbox database health probe failed.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: 503, jsonBody: { ok: false, service: SERVICE_NAME } };
  }
}

export function evaluateOutboxLiveness(
  context: OperationalLogger,
  environment: Environment = process.env,
): { status: 200 | 503; jsonBody: { ok: boolean; service: string } } {
  const configuration = evaluateWorkerConfiguration(environment);
  if (!configuration.ready) {
    context.warn("Email outbox liveness check is not ready.", {
      issueCodes: configuration.issues,
    });
    return { status: 503, jsonBody: { ok: false, service: SERVICE_NAME } };
  }
  return { status: 200, jsonBody: { ok: true, service: SERVICE_NAME } };
}
