import { readFile } from "node:fs/promises";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { AdminRole, EnquiryStatus, EnquiryType, Prisma } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { ENQUIRY_CONSENT_VERSION } from "@/lib/enquiries/constants";
import { encryptEnquiryPayload } from "@/lib/enquiries/encryption";
import { generatedPublicReference, requestFingerprint, sha256 } from "@/lib/enquiries/security";

type LegacyRecord = Record<string, unknown>;

function value(record: LegacyRecord, key: string, maximum: number): string {
  const candidate = record[key];
  return typeof candidate === "string" ? candidate.trim().slice(0, maximum) : "";
}

function date(record: LegacyRecord, key: string): Date {
  const parsed = new Date(value(record, key, 80));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function status(record: LegacyRecord): EnquiryStatus {
  const candidate = value(record, "status", 40).toLowerCase();
  return {
    new: EnquiryStatus.NEW,
    contacted: EnquiryStatus.CONTACTED,
    appointment_booked: EnquiryStatus.APPOINTMENT_BOOKED,
    qualified: EnquiryStatus.QUALIFIED,
    converted: EnquiryStatus.CONVERTED,
    closed: EnquiryStatus.CLOSED,
    spam: EnquiryStatus.SPAM,
  }[candidate] || EnquiryStatus.NEW;
}

async function fromFile(filePath: string): Promise<LegacyRecord[]> {
  const lines = (await readFile(filePath, "utf8")).split(/\r?\n/).filter(Boolean);
  return lines
    .map((line) => JSON.parse(line) as LegacyRecord)
    .filter((record) => record.eventType === "lead.created" || !record.eventType);
}

async function fromAzure(): Promise<LegacyRecord[]> {
  const tableName = process.env.AZURE_TABLE_NAME?.trim();
  const endpoint = process.env.AZURE_TABLES_ENDPOINT?.trim();
  const connectionString = process.env.AZURE_TABLES_CONNECTION_STRING?.trim();
  if (!tableName) throw new Error("AZURE_TABLE_NAME is required for --azure.");
  const client = endpoint
    ? new TableClient(endpoint, tableName, new DefaultAzureCredential())
    : connectionString
      ? TableClient.fromConnectionString(connectionString, tableName)
      : undefined;
  if (!client) throw new Error("Azure Table endpoint or connection string is required for --azure.");
  const records: LegacyRecord[] = [];
  for await (const entity of client.listEntities()) records.push(entity as unknown as LegacyRecord);
  return records;
}

async function importRecord(record: LegacyRecord, commit: boolean): Promise<"validated" | "created" | "duplicate"> {
  const partitionKey = value(record, "partitionKey", 160) || "unknown";
  const rowKey = value(record, "rowKey", 160) || sha256(JSON.stringify(record)).slice(0, 32);
  const name = value(record, "name", 120);
  const phone = value(record, "phone", 30);
  const city = value(record, "city", 80);
  const service = value(record, "serviceNeeded", 160) || "Legacy website enquiry";
  if (!name || !phone || !city) throw new Error(`Legacy record ${partitionKey}/${rowKey} lacks required fields.`);
  if (!commit) return "validated";

  const createdAt = date(record, "submittedAt");
  const message = value(record, "message", 4000);
  const sensitive = message ? encryptEnquiryPayload({ message }) : undefined;
  const idempotencyHash = sha256(`legacy:${partitionKey}:${rowKey}`);

  try {
    await getPrisma().enquiry.create({
      data: {
        reference: generatedPublicReference(),
        idempotencyHash,
        requestFingerprint: requestFingerprint({ partitionKey, rowKey }),
        type: EnquiryType.CONTACT,
        status: status(record),
        name,
        email: value(record, "email", 320) || undefined,
        phone,
        city,
        service,
        preferredChannel: value(record, "preferredChannel", 40) || undefined,
        preferredCallbackTime: value(record, "preferredCallbackTime", 80) || undefined,
        source: value(record, "leadSource", 80) || "legacy_import",
        sourcePath: value(record, "sourcePage", 500) || "/",
        landingPage: value(record, "landingPage", 500) || undefined,
        utmSource: value(record, "utmSource", 200) || undefined,
        utmMedium: value(record, "utmMedium", 200) || undefined,
        utmCampaign: value(record, "utmCampaign", 200) || undefined,
        utmTerm: value(record, "utmTerm", 200) || undefined,
        utmContent: value(record, "utmContent", 200) || undefined,
        context: { legacyPartitionKey: partitionKey, legacyRowKey: rowKey },
        consent: record.consent === true,
        consentAt: date(record, "consentAt"),
        consentVersion: value(record, "consentVersion", 80) || ENQUIRY_CONSENT_VERSION,
        createdAt,
        sensitiveData: sensitive ? { create: sensitive } : undefined,
      },
    });
    return "created";
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "duplicate";
    }
    throw error;
  }
}

async function main() {
  const commit = process.argv.includes("--commit");
  const azure = process.argv.includes("--azure");
  const fileIndex = process.argv.indexOf("--file");
  const filePath = fileIndex >= 0 ? process.argv[fileIndex + 1] : undefined;
  if (azure === Boolean(filePath)) {
    throw new Error("Choose exactly one source: --azure or --file <path>.");
  }
  const approvalIndex = process.argv.indexOf("--approved-by");
  const approvedByEmail = approvalIndex >= 0 ? process.argv[approvalIndex + 1]?.trim().toLowerCase() : undefined;
  let owner: { id: string; email: string } | undefined;
  if (commit) {
    if (!approvedByEmail) throw new Error("--approved-by <owner email> is required with --commit.");
    owner = await getPrisma().adminUser.findFirst({
      where: { email: approvedByEmail, role: AdminRole.OWNER, active: true },
      select: { id: true, email: true },
    }) || undefined;
    if (!owner || process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase() !== owner.email) {
      throw new Error("The approving email must be the active configured OWNER account.");
    }
  }
  const records = (azure ? await fromAzure() : await fromFile(filePath!)).sort((left, right) =>
    `${value(left, "partitionKey", 160)}:${value(left, "rowKey", 160)}`.localeCompare(
      `${value(right, "partitionKey", 160)}:${value(right, "rowKey", 160)}`,
    ),
  );
  const sourceHash = requestFingerprint(records);
  const counts = { validated: 0, created: 0, duplicate: 0 };
  for (const record of records) counts[await importRecord(record, commit)] += 1;
  if (commit && owner) {
    await getPrisma().auditLog.create({
      data: {
        actorId: owner.id,
        action: "legacy_enquiry_import.completed",
        entityType: "EnquiryMigration",
        entityId: sourceHash,
        metadata: { source: azure ? "azure_table" : "ndjson", sourceHash, ...counts },
      },
    });
  }
  console.info(commit ? "Legacy enquiry import complete" : "Dry-run validation complete", {
    source: azure ? "azure_table" : "ndjson",
    sourceHash,
    ...counts,
  });
  if (!commit) console.info("No records were written. Re-run with --commit after reviewing the count.");
}

main()
  .catch((error) => {
    console.error("Legacy import stopped", { errorType: error instanceof Error ? error.name : "UnknownError" });
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) await getPrisma().$disconnect().catch(() => undefined);
  });
