import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  audiosenPrisma?: PrismaClient;
};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured.");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }

  const client =
    globalForPrisma.audiosenPrisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.audiosenPrisma = client;
  }

  return client;
}
