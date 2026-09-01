import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const nextDirectory = path.join(root, ".next");
const chunksDirectory = path.join(nextDirectory, "static", "chunks");
const sceneGzipLimitBytes = 256_000;
const sceneMarkers = ["WebGLRenderer"];
const loaderMarkers = ["Lightweight 3D", "Optimized still"];

function fail(message: string): never {
  throw new Error(`Bundle budget failed: ${message}`);
}

function normalizeChunk(value: string): string {
  return value.replace(/^\/?_next\//, "").replaceAll("\\", "/");
}

async function readJson<T>(file: string): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail(`cannot read ${path.relative(root, file)} (${reason})`);
  }
}

async function homepageEntries(): Promise<Set<string>> {
  const manifestFile = path.join(nextDirectory, "server", "app", "page_client-reference-manifest.js");
  let source: string;
  try {
    source = await readFile(manifestFile, "utf8");
  } catch {
    return fail("missing homepage client-reference manifest; run `npm run build` first");
  }

  const assignment = 'globalThis.__RSC_MANIFEST["/page"] = ';
  const assignmentIndex = source.indexOf(assignment);
  if (assignmentIndex < 0) return fail("homepage client-reference manifest has an unknown format");
  const jsonStart = assignmentIndex + assignment.length;
  const jsonEnd = source.lastIndexOf(";");
  if (jsonEnd <= jsonStart) return fail("homepage client-reference manifest is truncated");

  const manifest = JSON.parse(source.slice(jsonStart, jsonEnd)) as {
    entryJSFiles?: Record<string, string[]>;
  };
  const entryFiles = Object.entries(manifest.entryJSFiles ?? {})
    .filter(([entry]) => entry === "[project]/app/layout" || entry === "[project]/app/page")
    .flatMap(([, files]) => files);
  if (entryFiles.length === 0) return fail("homepage initial client entries could not be identified");

  const buildManifest = await readJson<{
    polyfillFiles?: string[];
    rootMainFiles?: string[];
  }>(path.join(nextDirectory, "build-manifest.json"));
  return new Set(
    [
      ...entryFiles,
      ...(buildManifest.polyfillFiles ?? []),
      ...(buildManifest.rootMainFiles ?? []),
    ].map(normalizeChunk),
  );
}

async function main() {
  let chunkNames: string[];
  try {
    chunkNames = (await readdir(chunksDirectory)).filter((name) => name.endsWith(".js"));
  } catch {
    return fail("missing Next.js client chunks; run `npm run build` first");
  }

  const chunks = new Map<string, Buffer>();
  await Promise.all(
    chunkNames.map(async (name) => {
      chunks.set(`static/chunks/${name}`, await readFile(path.join(chunksDirectory, name)));
    }),
  );

  const loaderChunks = [...chunks.entries()].filter(([, contents]) => {
    const source = contents.toString("utf8");
    return loaderMarkers.every((marker) => source.includes(marker));
  });
  if (loaderChunks.length > 1) {
    return fail(`expected at most one hearing-aid scene loader chunk, found ${loaderChunks.length}`);
  }

  const initialChunks = await homepageEntries();
  if (loaderChunks.length === 0) {
    const eagerlyLoadedScenes = [...chunks.entries()]
      .filter(([name]) => initialChunks.has(name))
      .filter(([, contents]) =>
        sceneMarkers.every((marker) => contents.toString("utf8").includes(marker)),
      )
      .map(([name]) => name);
    if (eagerlyLoadedScenes.length > 0) {
      return fail(`Three.js scene entered the homepage initial scripts: ${eagerlyLoadedScenes.join(", ")}`);
    }
    console.log("Bundle budget passed", {
      loaderChunk: null,
      sceneChunks: [],
      sceneGzipLimitBytes,
      lazyFromHomepage: true,
    });
    return;
  }

  const [loaderName, loaderContents] = loaderChunks[0];
  const referencedChunks = new Set(
    loaderContents
      .toString("utf8")
      .match(/static\/chunks\/[A-Za-z0-9._-]+\.js/g)
      ?.map(normalizeChunk) ?? [],
  );
  const sceneChunks = [...chunks.entries()].filter(([name, contents]) => {
    if (!referencedChunks.has(name)) return false;
    const source = contents.toString("utf8");
    return sceneMarkers.every((marker) => source.includes(marker));
  });
  if (sceneChunks.length === 0) {
    return fail("the loader no longer references a recognizable lazy Three.js scene chunk");
  }

  if (!initialChunks.has(loaderName)) {
    return fail(`scene loader ${loaderName} is no longer an initial homepage entry`);
  }
  const eagerlyLoadedScenes = sceneChunks
    .map(([name]) => name)
    .filter((name) => initialChunks.has(name));
  if (eagerlyLoadedScenes.length > 0) {
    return fail(`lazy scene entered the homepage initial scripts: ${eagerlyLoadedScenes.join(", ")}`);
  }

  const measurements = sceneChunks.map(([name, contents]) => ({
    name,
    rawBytes: contents.byteLength,
    gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
  }));
  const totalGzipBytes = measurements.reduce((sum, measurement) => sum + measurement.gzipBytes, 0);
  if (totalGzipBytes > sceneGzipLimitBytes) {
    return fail(
      `lazy scene totals ${totalGzipBytes.toLocaleString()} gzip bytes; limit is ${sceneGzipLimitBytes.toLocaleString()}`,
    );
  }

  console.log("Bundle budget passed", {
    loaderChunk: loaderName,
    sceneChunks: measurements,
    sceneGzipLimitBytes,
    lazyFromHomepage: true,
  });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
