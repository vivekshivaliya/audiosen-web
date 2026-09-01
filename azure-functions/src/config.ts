const REQUIRED_SENDER = "support@audiosen.com";

export type WorkerConfigurationIssue =
  | "worker_disabled"
  | "database_url_missing"
  | "database_url_invalid"
  | "sender_missing"
  | "sender_not_support_address"
  | "acs_credentials_missing"
  | "acs_credentials_ambiguous"
  | "acs_endpoint_invalid"
  | "acs_connection_string_invalid"
  | "timer_schedule_missing"
  | "timer_schedule_invalid"
  | "functions_runtime_invalid"
  | "host_storage_missing"
  | "development_storage_forbidden";

export type WorkerConfiguration =
  | { ready: true }
  | { ready: false; issues: WorkerConfigurationIssue[] };

type Environment = Record<string, string | undefined>;

function value(environment: Environment, name: string): string | undefined {
  return environment[name]?.trim() || undefined;
}

function validDatabaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === "postgres:" || url.protocol === "postgresql:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function validAcsEndpoint(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
    );
  } catch {
    return false;
  }
}

function validAcsConnectionString(raw: string): boolean {
  const fields = new Map<string, string>();
  for (const part of raw.split(";").map((item) => item.trim()).filter(Boolean)) {
    const separator = part.indexOf("=");
    if (separator <= 0) return false;
    const key = part.slice(0, separator).trim().toLowerCase();
    const fieldValue = part.slice(separator + 1).trim();
    if (!fieldValue || fields.has(key)) return false;
    fields.set(key, fieldValue);
  }
  const endpoint = fields.get("endpoint");
  return Boolean(endpoint && validAcsEndpoint(endpoint) && fields.get("accesskey"));
}

function validTimerSchedule(raw: string): boolean {
  return raw.length <= 100 && !raw.includes("%") && raw.split(/\s+/u).length === 6;
}

/**
 * Checks every setting that can cause the timer to read or send data. It returns
 * bounded issue codes only; configuration values must never be logged.
 */
export function evaluateWorkerConfiguration(environment: Environment): WorkerConfiguration {
  const issues: WorkerConfigurationIssue[] = [];

  if (value(environment, "EMAIL_OUTBOX_WORKER_ENABLED") !== "true") {
    issues.push("worker_disabled");
  }

  const databaseUrl = value(environment, "DATABASE_URL");
  if (!databaseUrl) issues.push("database_url_missing");
  else if (!validDatabaseUrl(databaseUrl)) issues.push("database_url_invalid");

  const sender = value(environment, "AZURE_COMMUNICATION_EMAIL_SENDER")?.toLowerCase();
  if (!sender) issues.push("sender_missing");
  else if (sender !== REQUIRED_SENDER) issues.push("sender_not_support_address");

  const endpoint = value(environment, "AZURE_COMMUNICATION_EMAIL_ENDPOINT");
  const connectionString = value(environment, "AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING");
  if (!endpoint && !connectionString) issues.push("acs_credentials_missing");
  if (endpoint && connectionString) issues.push("acs_credentials_ambiguous");
  if (endpoint && !validAcsEndpoint(endpoint)) issues.push("acs_endpoint_invalid");
  if (connectionString && !validAcsConnectionString(connectionString)) {
    issues.push("acs_connection_string_invalid");
  }

  const schedule = value(environment, "EMAIL_OUTBOX_TIMER_SCHEDULE");
  if (!schedule) issues.push("timer_schedule_missing");
  else if (!validTimerSchedule(schedule)) issues.push("timer_schedule_invalid");

  if (value(environment, "FUNCTIONS_WORKER_RUNTIME") !== "node") {
    issues.push("functions_runtime_invalid");
  }

  const hostStorage = value(environment, "AzureWebJobsStorage");
  const hostStorageAccount = value(environment, "AzureWebJobsStorage__accountName");
  if (!hostStorage && !hostStorageAccount) issues.push("host_storage_missing");
  if (value(environment, "WEBSITE_HOSTNAME") && hostStorage === "UseDevelopmentStorage=true") {
    issues.push("development_storage_forbidden");
  }

  return issues.length === 0 ? { ready: true } : { ready: false, issues };
}
