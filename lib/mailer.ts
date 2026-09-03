import {
  EmailClient,
  KnownEmailSendStatus,
  type EmailMessage,
} from "@azure/communication-email";
import { DefaultAzureCredential } from "@azure/identity";
import nodemailer from "nodemailer9";

// This is an existing provider-verified sender, not the public contact address.
const VERIFIED_TRANSACTIONAL_SENDER = "support@audiosen.com";
const AZURE_MANAGED_SENDER = /^[a-z0-9._%+-]+@[a-f0-9-]+\.azurecomm\.net$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type QueuedEmailMessage = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  operationId: string;
};

export type QueuedEmailResult = {
  providerMessageId: string;
  providerStatus: string;
};

export class AzureEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AzureEmailConfigurationError";
  }
}

export class AzureEmailDeliveryError extends Error {
  readonly providerMessageId?: string;
  readonly providerStatus?: string;
  readonly providerErrorCode?: string;

  constructor(options: {
    providerMessageId?: string;
    providerStatus?: string;
    providerErrorCode?: string;
  }) {
    super("Azure Communication Services Email did not report successful delivery.");
    this.name = "AzureEmailDeliveryError";
    this.providerMessageId = options.providerMessageId;
    this.providerStatus = options.providerStatus;
    this.providerErrorCode = options.providerErrorCode;
  }
}

function configuredValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requireEmailAddress(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 320) {
    throw new AzureEmailConfigurationError(`${label} must be a valid email address.`);
  }
  return normalized;
}

function senderAddress(): string {
  const sender = configuredValue("AZURE_COMMUNICATION_EMAIL_SENDER");
  if (!sender) {
    throw new AzureEmailConfigurationError(
      "AZURE_COMMUNICATION_EMAIL_SENDER is required and must be a verified ACS sender.",
    );
  }

  const normalized = requireEmailAddress(sender, "AZURE_COMMUNICATION_EMAIL_SENDER");
  if (normalized !== VERIFIED_TRANSACTIONAL_SENDER && !AZURE_MANAGED_SENDER.test(normalized)) {
    throw new AzureEmailConfigurationError(
      `AZURE_COMMUNICATION_EMAIL_SENDER must be ${VERIFIED_TRANSACTIONAL_SENDER} or an Azure-managed verified sender.`,
    );
  }
  return normalized;
}

function communicationEmailClient(): EmailClient {
  const endpoint = configuredValue("AZURE_COMMUNICATION_EMAIL_ENDPOINT");
  if (endpoint) {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new AzureEmailConfigurationError(
        "AZURE_COMMUNICATION_EMAIL_ENDPOINT must be a valid HTTPS URL.",
      );
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      throw new AzureEmailConfigurationError(
        "AZURE_COMMUNICATION_EMAIL_ENDPOINT must be a credential-free HTTPS URL.",
      );
    }
    if (url.pathname !== "/") {
      throw new AzureEmailConfigurationError(
        "AZURE_COMMUNICATION_EMAIL_ENDPOINT must not contain a path.",
      );
    }
    return new EmailClient(url.origin, new DefaultAzureCredential());
  }

  const connectionString = configuredValue("AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING");
  if (connectionString) {
    return new EmailClient(connectionString);
  }

  throw new AzureEmailConfigurationError(
    "Configure AZURE_COMMUNICATION_EMAIL_ENDPOINT for managed identity or supply AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING from a secret store.",
  );
}

function hasAzureEmailConfiguration(): boolean {
  return Boolean(
    configuredValue("AZURE_COMMUNICATION_EMAIL_ENDPOINT") ||
      configuredValue("AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING"),
  );
}

function smtpConfiguration(): {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
} | null {
  const host = configuredValue("SMTP_HOST");
  if (!host) return null;

  const portRaw = configuredValue("SMTP_PORT") ?? "587";
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AzureEmailConfigurationError("SMTP_PORT must be a valid TCP port.");
  }
  const secureRaw = configuredValue("SMTP_SECURE")?.toLowerCase();
  if (secureRaw && secureRaw !== "true" && secureRaw !== "false") {
    throw new AzureEmailConfigurationError("SMTP_SECURE must be true or false.");
  }
  const user = configuredValue("SMTP_USER");
  const pass = configuredValue("SMTP_PASS");
  if (Boolean(user) !== Boolean(pass)) {
    throw new AzureEmailConfigurationError("SMTP_USER and SMTP_PASS must be configured together.");
  }
  const from = configuredValue("EMAIL_FROM") ?? configuredValue("MAIL_FROM") ?? VERIFIED_TRANSACTIONAL_SENDER;
  return { host, port, secure: secureRaw === "true" || (!secureRaw && port === 465), user, pass, from };
}

async function sendSmtpEmail(message: QueuedEmailMessage): Promise<QueuedEmailResult> {
  const config = smtpConfiguration();
  if (!config) throw new AzureEmailConfigurationError("SMTP_HOST is not configured.");
  const result = await nodemailer
    .createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.user && config.pass ? { auth: { user: config.user, pass: config.pass } } : {}),
    })
    .sendMail({
      from: config.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: { "X-Audiosen-Operation-Id": message.operationId },
    });
  return {
    providerMessageId: result.messageId || `smtp-${message.operationId}`,
    providerStatus: "smtp-accepted",
  };
}

async function sendAzureEmail(message: QueuedEmailMessage): Promise<QueuedEmailResult> {
  const to = requireEmailAddress(message.to, "Queued recipient");
  const replyTo = message.replyTo
    ? requireEmailAddress(message.replyTo, "Queued reply-to")
    : undefined;

  const payload: EmailMessage = {
    senderAddress: senderAddress(),
    content: {
      subject: message.subject,
      plainText: message.text,
      html: message.html,
    },
    recipients: { to: [{ address: to }] },
    replyTo: replyTo ? [{ address: replyTo }] : undefined,
    disableUserEngagementTracking: true,
  };

  const poller = await communicationEmailClient().beginSend(payload, {
    operationId: message.operationId,
    updateIntervalInMs: 2_000,
  });
  const result = await poller.pollUntilDone();

  if (result.status !== KnownEmailSendStatus.Succeeded) {
    throw new AzureEmailDeliveryError({
      providerMessageId: result.id,
      providerStatus: result.status,
      providerErrorCode: result.error?.code,
    });
  }

  return {
    providerMessageId: result.id,
    providerStatus: result.status,
  };
}

export async function sendQueuedEmail(
  message: QueuedEmailMessage,
): Promise<QueuedEmailResult> {
  requireEmailAddress(message.to, "Queued recipient");
  if (message.replyTo) requireEmailAddress(message.replyTo, "Queued reply-to");

  if (hasAzureEmailConfiguration() || configuredValue("AZURE_COMMUNICATION_EMAIL_SENDER")) {
    try {
      return await sendAzureEmail(message);
    } catch (error) {
      if (!smtpConfiguration()) throw error;
    }
  }
  return sendSmtpEmail(message);
}
