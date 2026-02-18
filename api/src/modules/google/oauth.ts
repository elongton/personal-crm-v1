import crypto from "crypto";
import { config, requireTokenKey } from "../../lib/config";
import { decryptString, encryptString } from "../../lib/crypto";
import { getOAuthAccount, upsertOAuthAccount } from "../auth/oauthStore";

interface OAuthState {
  tenantId: string;
  returnTo?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  subject: string;
  scopes: string;
}

function encodeState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function decodeState(value: string): OAuthState {
  const decoded = Buffer.from(value, "base64url").toString("utf8");
  return JSON.parse(decoded) as OAuthState;
}

export function buildGoogleAuthUrl(tenantId: string, returnTo?: string): string {
  const state = encodeState({ tenantId, returnTo });

  if (config.googleAuthMode === "mock") {
    const fakeCode = "mock-auth-code";
    return `${config.appBaseUrl}/auth/google/callback?code=${fakeCode}&state=${state}`;
  }

  if (!config.googleClientId) throw new Error("GOOGLE_CLIENT_ID missing");

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", config.googleClientId);
  u.searchParams.set("redirect_uri", config.googleRedirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("scope", config.googleOAuthScope);
  u.searchParams.set("state", state);
  return u.toString();
}

async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  if (config.googleAuthMode === "mock") {
    return {
      accessToken: `mock_access_${code}`,
      refreshToken: "mock_refresh_token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      subject: "mock-user@local",
      scopes: config.googleOAuthScope,
    };
  }

  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing");
  }

  const body = new URLSearchParams({
    code,
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    redirect_uri: config.googleRedirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    id_token?: string;
  };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
    subject: extractSubject(json.id_token) ?? "google-user",
    scopes: json.scope ?? config.googleOAuthScope,
  };
}

function extractSubject(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const [, payload] = idToken.split(".");
    if (!payload) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
    };
    return parsed.email ?? parsed.sub ?? null;
  } catch {
    return null;
  }
}

export async function handleGoogleCallback(code: string, state: string): Promise<{ tenantId: string; subject: string }> {
  const decoded = decodeState(state);
  const tokenResult = await exchangeCodeForTokens(code);
  const key = requireTokenKey();

  await upsertOAuthAccount({
    tenantId: decoded.tenantId,
    provider: "google",
    subject: tokenResult.subject,
    scopes: tokenResult.scopes,
    accessTokenEnc: encryptString(tokenResult.accessToken, key),
    refreshTokenEnc: encryptString(tokenResult.refreshToken, key),
    expiresAt: tokenResult.expiresAt,
    status: "active",
  });

  return { tenantId: decoded.tenantId, subject: tokenResult.subject };
}

export async function refreshGoogleAccessToken(tenantId: string, subject: string): Promise<string> {
  const account = await getOAuthAccount(tenantId, "google", subject);
  if (!account) throw new Error("OAuth account not found");

  const key = requireTokenKey();
  const refreshToken = decryptString(account.refreshTokenEnc, key);

  if (config.googleAuthMode === "mock") {
    const token = `mock_refreshed_${crypto.randomUUID()}`;
    await upsertOAuthAccount({
      ...account,
      accessTokenEnc: encryptString(token, key),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
    return token;
  }

  const body = new URLSearchParams({
    client_id: config.googleClientId ?? "",
    client_secret: config.googleClientSecret ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Google refresh failed: ${res.status}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in?: number };
  await upsertOAuthAccount({
    ...account,
    accessTokenEnc: encryptString(json.access_token, key),
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
  });

  return json.access_token;
}
