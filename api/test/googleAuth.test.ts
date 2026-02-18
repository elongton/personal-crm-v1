import test from "node:test";
import assert from "node:assert/strict";
import { encryptString, decryptString } from "../src/lib/crypto";
import { buildGoogleAuthUrl, handleGoogleCallback, refreshGoogleAccessToken } from "../src/modules/google/oauth";

process.env.GOOGLE_AUTH_MODE = "mock";
process.env.TOKEN_ENCRYPTION_KEY = "test-key-material";
process.env.APP_BASE_URL = "http://localhost:3000";

test("encrypt/decrypt roundtrip", () => {
  const enc = encryptString("secret", process.env.TOKEN_ENCRYPTION_KEY!);
  const dec = decryptString(enc, process.env.TOKEN_ENCRYPTION_KEY!);
  assert.equal(dec, "secret");
});

test("mock oauth callback persists and refreshes token", async () => {
  const authUrl = buildGoogleAuthUrl("tenant-test");
  const u = new URL(authUrl);
  const state = u.searchParams.get("state");
  assert.ok(state);

  const callback = await handleGoogleCallback("mock-auth-code", state!);
  assert.equal(callback.tenantId, "tenant-test");

  const refreshed = await refreshGoogleAccessToken("tenant-test", "mock-user@local");
  assert.match(refreshed, /^mock_refreshed_/);
});
