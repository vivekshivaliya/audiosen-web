import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const approvedPhone = "8923092563";
const approvedPublicEmail = "support@audiosen.com";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?<!\d)(?:\+?91[\s.-]*)?([6-9](?:[\s.-]*\d){9})(?!\d)/g;
const sensitiveAnalyticsKeys = new Set([
  "name",
  "email",
  "phone",
  "telephone",
  "mobile",
  "whatsapp",
  "address",
  "city",
  "postalcode",
  "pincode",
  "message",
  "hearingconcern",
  "health",
  "medical",
  "audiogram",
  "diagnosis",
  "age",
  "dateofbirth",
  "dob",
  "attachment",
  "filename",
  "reference",
  "enquiryid",
  "idempotencykey",
  "consent",
  "ip",
  "useragent",
]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(absolute);
      return sourceExtensions.has(path.extname(entry.name)) ? [absolute] : [];
    }),
  );
  return files.flat();
}

function relative(file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

function isTestFile(file: string): boolean {
  return /(?:^|\/)(?:e2e|tests)(?:\/|$)|\.(?:test|spec)\.[jt]sx?$/.test(relative(file));
}

function isPublicSurface(file: string): boolean {
  const name = relative(file);
  if (isTestFile(file)) return false;
  if (name.startsWith("app/admin/") || name.startsWith("app/api/")) return false;
  if (
    name.startsWith("lib/admin/") ||
    name.startsWith("lib/enquiries/") ||
    name.startsWith("lib/google-business/") ||
    name.startsWith("lib/uploads/")
  ) {
    return false;
  }
  return name.startsWith("app/") || name.startsWith("components/") || name.startsWith("lib/");
}

function normalizeAnalyticsKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function propertyName(node: ts.ObjectLiteralElementLike): string | undefined {
  if (!ts.isPropertyAssignment(node) && !ts.isShorthandPropertyAssignment(node)) return undefined;
  const name = node.name;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function isTrackEventCall(node: ts.CallExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === "trackEvent";
}

function isGtagEventCall(node: ts.CallExpression): boolean {
  if (
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "gtag" ||
    node.arguments.length < 3
  ) {
    return false;
  }
  return ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === "event";
}

function inspectAnalyticsSource(file: string, text: string, failures: string[], allowlist: Set<string>) {
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function inspectObject(object: ts.ObjectLiteralExpression, label: string) {
    for (const property of object.properties) {
      const name = propertyName(property);
      if (name && sensitiveAnalyticsKeys.has(normalizeAnalyticsKey(name))) {
        failures.push(`${relative(file)}: disallowed analytics field '${name}' in ${label}`);
      }
    }
  }

  function walk(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "analyticsParamAllowlist" &&
      node.initializer
    ) {
      const collect = (child: ts.Node) => {
        if (ts.isStringLiteral(child)) allowlist.add(child.text);
        ts.forEachChild(child, collect);
      };
      collect(node.initializer);
    }

    if (ts.isCallExpression(node)) {
      const argument = isTrackEventCall(node) ? node.arguments[1] : isGtagEventCall(node) ? node.arguments[2] : undefined;
      if (argument && ts.isObjectLiteralExpression(argument)) {
        inspectObject(argument, isTrackEventCall(node) ? "trackEvent" : "gtag event");
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
}

async function main() {
  const files = (
    await Promise.all(["app", "components", "lib"].map((directory) => sourceFiles(path.join(root, directory))))
  ).flat();
  const failures: string[] = [];
  const analyticsAllowlist = new Set<string>();
  let publicFilesChecked = 0;

  for (const file of files) {
    const text = await readFile(file, "utf8");
    if (!isTestFile(file)) inspectAnalyticsSource(file, text, failures, analyticsAllowlist);
    if (!isPublicSurface(file)) continue;
    publicFilesChecked += 1;

    for (const match of text.matchAll(emailPattern)) {
      const email = match[0].toLowerCase();
      if (email === approvedPublicEmail || /@example\.(?:com|org|net)$/.test(email)) continue;
      failures.push(`${relative(file)}: unapproved public email '${email}'`);
    }

    for (const match of text.matchAll(phonePattern)) {
      const digits = match[0].replace(/\D/g, "");
      const national = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
      const lineStart = text.lastIndexOf("\n", match.index ?? 0) + 1;
      const lineEnd = text.indexOf("\n", match.index ?? 0);
      const line = text.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
      const documentedPlaceholder = /\b(?:e\.?g\.?|example|placeholder)\b/i.test(line);
      const phoneContext = /(?:\b(?:phone|whatsapp|call|mobile|telephone)\b|tel:|wa\.me)/i.test(line);
      if (!phoneContext && !documentedPlaceholder) continue;
      if (national !== approvedPhone && !documentedPlaceholder) {
        failures.push(`${relative(file)}: unapproved public phone ending '${national.slice(-4)}'`);
      }
    }
  }

  if (analyticsAllowlist.size === 0) {
    failures.push("lib/analytics.ts: analytics parameter allowlist was not found");
  }
  for (const key of analyticsAllowlist) {
    if (sensitiveAnalyticsKeys.has(normalizeAnalyticsKey(key))) {
      failures.push(`lib/analytics.ts: sensitive analytics key '${key}' is allowlisted`);
    }
  }

  if (failures.length > 0) {
    console.error(`Content guard failed with ${failures.length} issue(s):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.info("Content guard passed", {
    publicFilesChecked,
    analyticsAllowlistKeys: analyticsAllowlist.size,
    approvedPhone,
    approvedPublicEmail,
  });
}

void main();
