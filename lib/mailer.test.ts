import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AzureEmailConfigurationError,
  sendQueuedEmail,
  type QueuedEmailMessage,
} from "@/lib/mailer";

const queuedMessage: QueuedEmailMessage = {
  to: "patient@example.com",
  subject: "Audiosen enquiry received",
  text: "Thank you.",
  html: "<p>Thank you.</p>",
  operationId: "36d8fae4-6628-49b2-a36a-1fca4dd808e2",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Azure Communication Services Email configuration", () => {
  it("fails before provider access when the verified sender is absent", async () => {
    vi.stubEnv("AZURE_COMMUNICATION_EMAIL_SENDER", "");

    await expect(sendQueuedEmail(queuedMessage)).rejects.toBeInstanceOf(
      AzureEmailConfigurationError,
    );
  });

  it("rejects an unverified address as the provider sender", async () => {
    vi.stubEnv("AZURE_COMMUNICATION_EMAIL_SENDER", "vivekshivaliya10@gmail.com");

    await expect(sendQueuedEmail(queuedMessage)).rejects.toThrow(
      "AZURE_COMMUNICATION_EMAIL_SENDER must be support@audiosen.com or an Azure-managed verified sender.",
    );
  });

  it("rejects a non-HTTPS managed-identity endpoint", async () => {
    vi.stubEnv("AZURE_COMMUNICATION_EMAIL_SENDER", "support@audiosen.com");
    vi.stubEnv("AZURE_COMMUNICATION_EMAIL_ENDPOINT", "http://example.com");
    vi.stubEnv("AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING", "");

    await expect(sendQueuedEmail(queuedMessage)).rejects.toThrow(
      "AZURE_COMMUNICATION_EMAIL_ENDPOINT must be a credential-free HTTPS URL.",
    );
  });
});
