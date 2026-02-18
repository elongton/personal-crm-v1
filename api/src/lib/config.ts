export type GoogleAuthMode = "real" | "mock";

function get(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbMode: process.env.DB_MODE ?? "mock",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  googleAuthMode: (process.env.GOOGLE_AUTH_MODE ?? "mock") as GoogleAuthMode,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/google/callback",
  googleOAuthScope:
    process.env.GOOGLE_OAUTH_SCOPE ??
    "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
};

export function requireTokenKey(): string {
  return get("TOKEN_ENCRYPTION_KEY");
}
