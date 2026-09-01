import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });

await build({
  entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("../dist/index.js", import.meta.url)),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  packages: "external",
  sourcemap: false,
  minify: false,
  logLevel: "info",
});
