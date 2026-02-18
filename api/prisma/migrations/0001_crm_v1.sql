-- Draft SQL migration for Personal CRM V1
-- Postgres + pgvector

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  scopes TEXT NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider, subject)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('backfill','daily')),
  status TEXT NOT NULL,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS source_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('gmail','calendar')),
  external_id TEXT NOT NULL,
  external_updated_at TIMESTAMPTZ,
  payload_jsonb JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source, external_id)
);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('backfill','daily')),
  last_completed_window_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, kind)
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  primary_email TEXT,
  company TEXT,
  title TEXT,
  how_known TEXT,
  health_score NUMERIC(5,2) DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  is_merged BOOLEAN NOT NULL DEFAULT FALSE,
  merged_into_contact_id UUID REFERENCES contacts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email','meeting')),
  occurred_at TIMESTAMPTZ NOT NULL,
  direction TEXT,
  subject TEXT,
  snippet TEXT,
  source_item_id UUID REFERENCES source_items(id)
);

CREATE TABLE IF NOT EXISTS merge_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  left_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  right_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  score NUMERIC(5,4) NOT NULL,
  reasons_jsonb JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','snoozed','done')),
  due_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  embed_version TEXT NOT NULL DEFAULT 'v1',
  text_snapshot TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, entity_type, entity_id, embed_version)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON contacts(tenant_id, primary_email);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_time ON interactions(contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_runs_tenant_started ON sync_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_tenant_updated ON sync_checkpoints(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_tenant_status ON reminders(tenant_id, status, due_at);
