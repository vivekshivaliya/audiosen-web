import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createGoogleBusinessOAuthState,
  verifyGoogleBusinessOAuthState,
} from "@/lib/google-business/state";

const previousSecret = process.env.AUTH_SECRET;

describe("Google Business OAuth state", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-only-secret-with-sufficient-entropy";
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousSecret;
  });

  it("binds a fresh state to the initiating admin", () => {
    const state = createGoogleBusinessOAuthState("owner-id");
    expect(verifyGoogleBusinessOAuthState(state, "owner-id")).toBe(true);
    expect(verifyGoogleBusinessOAuthState(state, "different-admin")).toBe(false);
  });

  it("rejects a tampered state", () => {
    const state = createGoogleBusinessOAuthState("owner-id");
    const [payload, signature] = state.split(".");
    expect(verifyGoogleBusinessOAuthState(`${payload}x.${signature}`, "owner-id")).toBe(false);
  });
});
