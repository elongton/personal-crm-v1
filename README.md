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
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm run prisma:generate
npm run dev:postgres
```

## API endpoints
- `GET /health`
- `GET /db/health`
