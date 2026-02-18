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
- `POST /ingestion/refresh`

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

Apply baseline to Postgres:
```bash
cd api
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm run prisma:migrate:baseline
```

Check migration status:
```bash
cd api
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm run prisma:migrate:status
```

## API endpoints
- `GET /health`
- `GET /db/health`
