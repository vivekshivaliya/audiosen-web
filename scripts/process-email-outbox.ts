import {
  disconnectEmailOutboxWorker,
  processEmailOutboxBatch,
} from "@/lib/email-outbox-worker";

async function main() {
  const watch = process.argv.includes("--watch");
  do {
    const result = await processEmailOutboxBatch();
    if (!watch) break;
    await new Promise((resolve) =>
      setTimeout(resolve, result.claimed > 0 ? 1_000 : 15_000),
    );
  } while (true);
}

main()
  .catch((error) => {
    console.error("Email outbox worker stopped", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!process.argv.includes("--watch")) {
      await disconnectEmailOutboxWorker().catch(() => undefined);
    }
  });
