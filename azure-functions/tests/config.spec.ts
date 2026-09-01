import assert from "node:assert/strict";
import test from "node:test";
import { evaluateWorkerConfiguration } from "../src/config";

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

test("the worker is disabled and unready by default", () => {
  const result = evaluateWorkerConfiguration({});
  assert.equal(result.ready, false);
  if (result.ready) return;
  assert.ok(result.issues.includes("worker_disabled"));
  assert.ok(result.issues.includes("database_url_missing"));
  assert.ok(result.issues.includes("acs_credentials_missing"));
});

test("managed identity configuration is accepted", () => {
  assert.deepEqual(evaluateWorkerConfiguration(readyEnvironment()), { ready: true });
});

test("a Key Vault supplied ACS connection string is accepted as the sole credential", () => {
  const environment = readyEnvironment();
  delete environment.AZURE_COMMUNICATION_EMAIL_ENDPOINT;
  environment.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING = "endpoint=https://example.invalid/;accesskey=redacted";
  assert.deepEqual(evaluateWorkerConfiguration(environment), { ready: true });
});

test("ambiguous ACS credentials and any other sender fail closed", () => {
  const environment = readyEnvironment();
  environment.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING = "secret";
  environment.AZURE_COMMUNICATION_EMAIL_SENDER = "owner@example.com";
  const result = evaluateWorkerConfiguration(environment);
  assert.equal(result.ready, false);
  if (result.ready) return;
  assert.ok(result.issues.includes("acs_credentials_ambiguous"));
  assert.ok(result.issues.includes("sender_not_support_address"));
  assert.ok(result.issues.includes("acs_connection_string_invalid"));
});

test("an invalid database URL, endpoint, or NCRONTAB schedule fails closed", () => {
  const environment = readyEnvironment();
  environment.DATABASE_URL = "https://not-postgres.invalid";
  environment.AZURE_COMMUNICATION_EMAIL_ENDPOINT = "http://insecure.invalid/path";
  environment.EMAIL_OUTBOX_TIMER_SCHEDULE = "every minute";
  const result = evaluateWorkerConfiguration(environment);
  assert.equal(result.ready, false);
  if (result.ready) return;
  assert.ok(result.issues.includes("database_url_invalid"));
  assert.ok(result.issues.includes("acs_endpoint_invalid"));
  assert.ok(result.issues.includes("timer_schedule_invalid"));
});

test("Azurite is rejected when the Function is running in Azure", () => {
  const environment = readyEnvironment();
  delete environment.AzureWebJobsStorage__accountName;
  environment.AzureWebJobsStorage = "UseDevelopmentStorage=true";
  environment.WEBSITE_HOSTNAME = "audiosen-outbox.azurewebsites.net";
  const result = evaluateWorkerConfiguration(environment);
  assert.equal(result.ready, false);
  if (result.ready) return;
  assert.ok(result.issues.includes("development_storage_forbidden"));
});
