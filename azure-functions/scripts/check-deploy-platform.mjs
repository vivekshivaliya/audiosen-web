import assert from "node:assert/strict";

assert.equal(process.platform, "linux", "Build the production package on Linux for Prisma binary compatibility.");
assert.equal(process.arch, "x64", "The supported Azure Functions deployment target is Linux x64.");
assert.equal(
  Number(process.versions.node.split(".")[0]),
  22,
  "Build the production package with the same Node.js 22 major used by the Function app.",
);

console.info("Deployment build platform verified: Linux x64, Node.js 22.");
