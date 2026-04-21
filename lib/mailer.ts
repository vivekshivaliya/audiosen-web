import nodemailer, { type SendMailOptions } from "nodemailer";

const DEFAULT_OWNER_EMAIL = "vivekshivaliya@gmail.com";

function firstDefined(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function env(names: string[], label: string): string {
  const value = firstDefined(names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${label}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value.trim();
}

function smtpHost(): string {
  const configured = firstDefined(["SMTP_HOST"]);
  if (configured) {
    return configured.toLowerCase();
  }

  const service = firstDefined(["SMTP_SERVICE"]);
  if (service && service.toLowerCase() === "gmail") {
    return "smtp.gmail.com";
  }

  const user = smtpUser();
  if (user.toLowerCase().endsWith("@gmail.com")) {
    return "smtp.gmail.com";
  }

  throw new Error("Missing required environment variable: SMTP_HOST");
}

function smtpPort(): number {
  const configured = firstDefined(["SMTP_PORT"]);
  if (configured) {
    return Number(configured);
  }
  return smtpHost() === "smtp.gmail.com" ? 465 : 587;
}

function smtpSecure(): boolean {
  const configured = firstDefined(["SMTP_SECURE"]);
  if (configured) {
    return configured.toLowerCase() === "true";
  }
  return smtpPort() === 465;
}

function smtpUser(): string {
  return env(["SMTP_USER", "GMAIL_USER"], "SMTP_USER / GMAIL_USER");
}

function smtpPass(): string {
  let raw = env(
    ["SMTP_PASS", "GMAIL_APP_PASSWORD", "GMAIL_PASS"],
    "SMTP_PASS / GMAIL_APP_PASSWORD",
  ).trim();

  // Strip optional wrapping quotes from .env values.
  raw = raw.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

  // Gmail app passwords are sometimes pasted with spaces like: "abcd efgh ijkl mnop"
  if (smtpHost() === "smtp.gmail.com") {
    return raw.replace(/\s+/g, "");
  }
  return raw;
}

function validateMailConfig() {
  const host = smtpHost();
  if (host !== "smtp.gmail.com") {
    return;
  }

  const compactPass = smtpPass();
  if (compactPass.length !== 16) {
    throw new Error(
      "Gmail requires a Google-generated 16-character App Password. The configured value is not a valid Gmail App Password.",
    );
  }
}

function createTransport(host: string, port: number, secure: boolean) {
  return nodemailer.createTransport({
    service: host === "smtp.gmail.com" ? "gmail" : undefined,
    host,
    port,
    secure,
    auth: {
      user: smtpUser(),
      pass: smtpPass(),
    },
  });
}

export async function sendMail(message: SendMailOptions) {
  const host = smtpHost();
  const port = smtpPort();
  const secure = smtpSecure();

  validateMailConfig();

  const candidates: Array<{ host: string; port: number; secure: boolean }> = [
    { host, port, secure },
  ];

  // Gmail fallback if primary config uses a different TLS mode.
  if (host === "smtp.gmail.com") {
    if (!(port === 465 && secure)) {
      candidates.push({ host, port: 465, secure: true });
    }
    if (!(port === 587 && !secure)) {
      candidates.push({ host, port: 587, secure: false });
    }
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const transporter = createTransport(
        candidate.host,
        candidate.port,
        candidate.secure,
      );
      await transporter.sendMail(message);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export function mailConfig() {
  const smtpUserValue = optionalEnv("SMTP_USER");
  const fromFallback = smtpUserValue
    ? `Audiosen <${smtpUserValue}>`
    : `Audiosen <${DEFAULT_OWNER_EMAIL}>`;

  return {
    from: optionalEnv("MAIL_FROM") ?? fromFallback,
    to: optionalEnv("MAIL_TO") ?? DEFAULT_OWNER_EMAIL,
  };
}
