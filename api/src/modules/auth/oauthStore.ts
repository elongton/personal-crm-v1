import { getPrisma } from "../../lib/prisma";

export interface OAuthAccountRecord {
  tenantId: string;
  provider: string;
  subject: string;
  scopes: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  expiresAt: Date | null;
  status: "active" | "revoked";
}

const memoryStore = new Map<string, OAuthAccountRecord>();

function keyOf(tenantId: string, provider: string, subject: string): string {
  return `${tenantId}:${provider}:${subject}`;
}

function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function upsertOAuthAccount(record: OAuthAccountRecord): Promise<void> {
  if (!dbEnabled()) {
    memoryStore.set(keyOf(record.tenantId, record.provider, record.subject), record);
    return;
  }

  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO oauth_accounts (
      tenant_id, provider, subject, scopes,
      access_token_enc, refresh_token_enc, expires_at, status, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
    ON CONFLICT (tenant_id, provider, subject)
    DO UPDATE SET
      scopes = EXCLUDED.scopes,
      access_token_enc = EXCLUDED.access_token_enc,
      refresh_token_enc = EXCLUDED.refresh_token_enc,
      expires_at = EXCLUDED.expires_at,
      status = EXCLUDED.status,
      updated_at = now();
    `,
    record.tenantId,
    record.provider,
    record.subject,
    record.scopes,
    record.accessTokenEnc,
    record.refreshTokenEnc,
    record.expiresAt,
    record.status,
  );
}

export async function getOAuthAccount(
  tenantId: string,
  provider: string,
  subject: string,
): Promise<OAuthAccountRecord | null> {
  if (!dbEnabled()) {
    return memoryStore.get(keyOf(tenantId, provider, subject)) ?? null;
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      tenant_id: string;
      provider: string;
      subject: string;
      scopes: string;
      access_token_enc: string;
      refresh_token_enc: string;
      expires_at: Date | null;
      status: "active" | "revoked";
    }>
  >(
    `
    SELECT tenant_id, provider, subject, scopes, access_token_enc, refresh_token_enc, expires_at, status
    FROM oauth_accounts
    WHERE tenant_id = $1 AND provider = $2 AND subject = $3
    LIMIT 1;
    `,
    tenantId,
    provider,
    subject,
  );

  const row = rows[0];
  if (!row) return null;

  return {
    tenantId: row.tenant_id,
    provider: row.provider,
    subject: row.subject,
    scopes: row.scopes,
    accessTokenEnc: row.access_token_enc,
    refreshTokenEnc: row.refresh_token_enc,
    expiresAt: row.expires_at,
    status: row.status,
  };
}
