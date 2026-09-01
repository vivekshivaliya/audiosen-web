import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const canonicalSchemaUrl = new URL("../../prisma/schema.prisma", import.meta.url);
const generatedRootUrl = new URL("../.generated/prisma/", import.meta.url);
const generatedSchemaUrl = new URL("../.generated/prisma/schema.prisma", import.meta.url);
const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

await rm(generatedRootUrl, { recursive: true, force: true });
await mkdir(generatedRootUrl, { recursive: true });
await writeFile(generatedSchemaUrl, await readFile(canonicalSchemaUrl));

const generation = spawnSync(
  process.execPath,
  [prismaCli, "generate", "--schema", fileURLToPath(generatedSchemaUrl)],
  { cwd: packageRoot, env: process.env, stdio: "inherit" },
);
assert.equal(generation.status, 0, "Prisma Client generation failed.");

const generatedClient = new URL("../node_modules/.prisma/client/default.js", import.meta.url);
assert.ok((await readFile(generatedClient, "utf8")).length > 0, "Local Prisma Client was not generated.");
await rm(generatedRootUrl, { recursive: true, force: true });
