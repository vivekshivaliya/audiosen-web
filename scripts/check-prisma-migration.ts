import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");
const migrationPath = path.join(
  root,
  "prisma",
  "migrations",
  "20260822123000_backend_admin_foundation",
  "migration.sql",
);
const customMarker = "-- Business and Google-derived content cannot be published";
const requiredSafeguards = [
  '"providerMessageId" VARCHAR(200)',
  '"providerStatus" VARCHAR(80)',
  '"providerCheckedAt" TIMESTAMP(3)',
  'CONSTRAINT "BusinessProfile_published_requires_approval"',
  'CONSTRAINT "GoogleSnapshot_ttl_max_30_days"',
  'CONSTRAINT "GoogleReview_ttl_max_30_days"',
  'CONSTRAINT "Offer_discount_range"',
  'CONSTRAINT "EnquiryAttachment_positive_size"',
  'CREATE TRIGGER "AuditLog_append_only"',
] as const;

function normalizedSql(value: string): string {
  return value
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

async function main() {
  const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
  const generated = spawnSync(
    process.execPath,
    [
      prismaCli,
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      schemaPath,
      "--script",
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://schema_check:schema_check@127.0.0.1:5432/schema_check",
      },
    },
  );
  if (generated.status !== 0) {
    throw new Error(`Prisma migration diff failed (${generated.status ?? "no status"}).`);
  }

  const migration = await readFile(migrationPath, "utf8");
  const markerIndex = migration.indexOf(customMarker);
  if (markerIndex < 0) throw new Error("The custom migration safeguard marker is missing.");
  const generatedPrefix = normalizedSql(generated.stdout);
  const committedPrefix = normalizedSql(migration.slice(0, markerIndex));
  if (generatedPrefix !== committedPrefix) {
    const expectedLines = generatedPrefix.split("\n");
    const actualLines = committedPrefix.split("\n");
    const mismatch = expectedLines.findIndex((line, index) => line !== actualLines[index]);
    throw new Error(
      `Prisma schema and initial migration differ at generated line ${mismatch + 1}. Regenerate and reapply the custom safeguards.`,
    );
  }

  for (const safeguard of requiredSafeguards) {
    if (!migration.includes(safeguard)) {
      throw new Error(`Required migration safeguard is missing: ${safeguard}`);
    }
  }

  console.info("Prisma migration guard passed", {
    generatedLines: generatedPrefix.split("\n").length,
    customSafeguards: requiredSafeguards.length,
  });
}

void main();
