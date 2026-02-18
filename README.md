# Fullstack React + Fastify + Postgres Template

Starter repository for a fullstack app with:
- `web`: React + Vite frontend served via Nginx
- `api`: Fastify + Prisma backend for PostgreSQL
- `.github/workflows/deploy.yml`: container build and deployment workflow

Tiny edit.

## Project structure
```
.
├─ web/
├─ api/
├─ worker/
├─ packages/
│  └─ contracts/
├─ .github/workflows/deploy.yml
├─ deploy.config.example.yml
└─ README.md
```

## Quick start

### Web
```bash
cd web
npm install
npm run dev
```

### API
```bash
cd api
npm install
npm run dev
```

`npm run dev` now uses a local SQLite database at `api/prisma/dev.db`.

If you want to run API dev against PostgreSQL instead:
```bash
cd api
export DB_MODE=postgres
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm run prisma:generate
npm run dev:postgres
```

### Running locally in mock mode (no external credentials)
```bash
cp .env.example .env
cd api
npm install
set -a; source ../.env; set +a
npm run dev:postgres
```

In another shell, run demo data seed:
```bash
cd api
set -a; source ../.env; set +a
npm run seed:mock
```

Key mock-mode endpoints:
- `POST /auth/google/start` (returns deterministic mock callback URL)
- `GET /auth/google/callback`
- `POST /ingestion/start`
- `GET /ingestion/status`
- `GET /coverage`
- `GET /metrics`
- `POST /ingestion/refresh`

Backfill behavior:
- Backfill runs in monthly chunks between `startIso` and `endIso`.
- Checkpoints are persisted in `sync_checkpoints` to resume after failures.
- `SYNC_FAIL_AFTER_CHUNKS=<n>` can be used in local tests to simulate a mid-run crash after `n` chunks.

`GOOGLE_CONNECTOR_MODE=real` is scaffolded but intentionally throws TODO errors until real Gmail/Calendar adapters are wired.

### Worker
```bash
cd worker
npm install
npm run dev
```

The worker currently boots an in-memory queue and processes a no-op job for local verification.

## Postgres migration workflow (M1 baseline)

Baseline SQL lives at:
- `api/prisma/migrations/0001_crm_v1.sql`

### End-to-end local verification (Task 2)

This is the exact local workflow used to verify baseline migration + API DB health against Postgres.

1) Start local Postgres (Docker)
```bash
docker run --name personal-crm-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app \
  -p 5432:5432 -d pgvector/pgvector:pg16
```
Expected output includes a container id (hex string).

2) Apply baseline migration
```bash
cd api
export DB_MODE=postgres
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm run prisma:migrate:baseline
```
Expected output includes:
- `Script executed successfully.`

3) Re-apply baseline (idempotency check)
```bash
npm run prisma:migrate:baseline
```
Expected output includes:
- `Script executed successfully.`

4) Verify migration status
```bash
npm run prisma:migrate:status
```
Expected output includes:
- `Database schema is up to date!`

5) Start API against Postgres and check DB health
```bash
npm run dev:postgres
# in another shell
curl -s http://localhost:3000/db/health
```
Expected API response:
```json
{"ok":true,"database":"postgres","status":"healthy"}
```

6) Cleanup (optional)
```bash
docker stop personal-crm-pg && docker rm personal-crm-pg
```

## API endpoints
- `GET /health`
- `GET /db/health`
