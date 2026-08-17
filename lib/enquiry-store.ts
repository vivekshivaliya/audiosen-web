import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

export type LeadStatus = "new" | "contacted" | "qualified" | "closed";
export type DeliveryStatus = "pending" | "sent" | "failed" | "not_requested";

export type EnquiryRecord = {
  submittedAt: string;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string;
  city: string;
  language: string;
  serviceNeeded: string;
  preferredChannel: string;
  preferredCallbackTime: string;
  leadSource: string;
  message: string;
  landingPage: string;
  sourcePage: string;
  consent: boolean;
  consentAt: string;
  consentVersion: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  msclkid: string;
  fbclid: string;
};

export type EnquiryDeliveryUpdate = {
  staffNotificationStatus?: DeliveryStatus;
  staffNotificationAt?: string;
  staffNotificationError?: string;
  confirmationStatus?: DeliveryStatus;
  confirmationAt?: string;
  confirmationError?: string;
};

export type SavedEnquiry = {
  partitionKey: string;
  rowKey: string;
  backend: "azure-table" | "development-file";
};

export class EnquiryStorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnquiryStorageConfigurationError";
  }
}

export class EnquiryStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnquiryStorageUnavailableError";
  }
}

const dataDir = process.env.AUDIOSEN_DATA_DIR || path.join(process.cwd(), "data");
const enquiryLogPath = path.join(dataDir, "enquiries.ndjson");
let tableClientPromise: Promise<TableClient> | undefined;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function validateTableName(tableName: string): void {
  if (!/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(tableName)) {
    throw new EnquiryStorageConfigurationError(
      "AZURE_TABLE_NAME must be 3-63 alphanumeric characters and start with a letter.",
    );
  }
}

function validateEndpoint(endpoint: string): void {
  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    throw new EnquiryStorageConfigurationError(
      "AZURE_TABLES_ENDPOINT must be a valid Azure Table service URL.",
    );
  }

  if (isProduction() && url.protocol !== "https:") {
    throw new EnquiryStorageConfigurationError(
      "AZURE_TABLES_ENDPOINT must use HTTPS in production.",
    );
  }
}

function isConflict(error: unknown): boolean {
  const candidate = error as { statusCode?: number; code?: string } | undefined;
  return candidate?.statusCode === 409 || candidate?.code === "TableAlreadyExists";
}

async function createConfiguredTableClient(): Promise<TableClient> {
  const tableName = process.env.AZURE_TABLE_NAME?.trim();
  const endpoint = process.env.AZURE_TABLES_ENDPOINT?.trim();
  const connectionString = process.env.AZURE_TABLES_CONNECTION_STRING?.trim();

  if (!tableName) {
    throw new EnquiryStorageConfigurationError(
      "AZURE_TABLE_NAME is required for durable lead storage.",
    );
  }
  validateTableName(tableName);

  let client: TableClient;

  if (endpoint) {
    validateEndpoint(endpoint);
    client = new TableClient(endpoint, tableName, new DefaultAzureCredential());
  } else if (!isProduction() && connectionString) {
    client = TableClient.fromConnectionString(connectionString, tableName);
  } else {
    throw new EnquiryStorageConfigurationError(
      isProduction()
        ? "AZURE_TABLES_ENDPOINT is required in production; App Service managed identity is used for authentication."
        : "Set AZURE_TABLES_ENDPOINT for managed identity or AZURE_TABLES_CONNECTION_STRING for local development.",
    );
  }

  try {
    await client.createTable();
  } catch (error) {
    if (!isConflict(error)) throw error;
  }

  return client;
}

async function getTableClient(): Promise<TableClient> {
  tableClientPromise ??= createConfiguredTableClient();

  try {
    return await tableClientPromise;
  } catch (error) {
    tableClientPromise = undefined;
    if (error instanceof EnquiryStorageConfigurationError) throw error;
    throw new EnquiryStorageUnavailableError(
      `Azure Table lead storage is unavailable: ${
        error instanceof Error ? error.message : "unknown storage error"
      }`,
    );
  }
}

function shouldUseDevelopmentFileFallback(): boolean {
  return (
    !isProduction() &&
    !process.env.AZURE_TABLES_ENDPOINT?.trim() &&
    !process.env.AZURE_TABLES_CONNECTION_STRING?.trim()
  );
}

async function appendDevelopmentEvent(event: Record<string, unknown>): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await appendFile(enquiryLogPath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function saveEnquiry(record: EnquiryRecord): Promise<SavedEnquiry> {
  const rowKey = crypto.randomUUID();
  const partitionKey = `website${record.submittedAt.slice(0, 7).replace("-", "")}`;
  const updatedAt = record.submittedAt;
  const initialDelivery = {
    staffNotificationStatus: "pending" as const,
    confirmationStatus: record.email ? ("pending" as const) : ("not_requested" as const),
  };

  if (shouldUseDevelopmentFileFallback()) {
    await appendDevelopmentEvent({
      eventType: "lead.created",
      partitionKey,
      rowKey,
      ...record,
      ...initialDelivery,
      updatedAt,
    });
    return { partitionKey, rowKey, backend: "development-file" };
  }

  const client = await getTableClient();

  try {
    await client.createEntity({
      partitionKey,
      rowKey,
      ...record,
      ...initialDelivery,
      updatedAt,
    });
  } catch (error) {
    throw new EnquiryStorageUnavailableError(
      `The enquiry could not be written to Azure Table Storage: ${
        error instanceof Error ? error.message : "unknown storage error"
      }`,
    );
  }

  return { partitionKey, rowKey, backend: "azure-table" };
}

export async function updateEnquiryDelivery(
  enquiry: SavedEnquiry,
  update: EnquiryDeliveryUpdate,
): Promise<void> {
  const updatedAt = new Date().toISOString();

  if (enquiry.backend === "development-file") {
    await appendDevelopmentEvent({
      eventType: "lead.delivery_updated",
      partitionKey: enquiry.partitionKey,
      rowKey: enquiry.rowKey,
      ...update,
      updatedAt,
    });
    return;
  }

  const client = await getTableClient();
  await client.updateEntity(
    {
      partitionKey: enquiry.partitionKey,
      rowKey: enquiry.rowKey,
      ...update,
      updatedAt,
    },
    "Merge",
  );
}
