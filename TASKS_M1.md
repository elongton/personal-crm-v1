# TASKS_M1 — Personal CRM V1

## Goal
Ship M1 foundation: OAuth, 12-month Gmail/Calendar backfill, normalized contact/interactions store, scheduled daily sync, and ingestion status visibility.

## Ordered Tasks

1. **Repo scaffolding**
   - Create `api`, `worker`, and shared contracts package boundaries.
   - Acceptance: worker can run a no-op queued job locally.

2. **DB baseline migration**
   - Apply `api/prisma/migrations/0001_crm_v1.sql` to Postgres.
   - Acceptance: all core tables created and indexed.

3. **Google OAuth integration**
   - Implement `POST /auth/google/start`, `GET /auth/google/callback`.
   - Store encrypted access/refresh tokens.
   - Acceptance: account connected and token refresh works.

4. **Connector clients (Gmail + Calendar)**
   - Typed adapters with pagination, retry/backoff, rate limit handling.
   - Acceptance: fixture + mocked integration tests pass.

5. **Backfill orchestrator**
   - `backfill_job(tenant, now-12mo, now)` with monthly chunking.
   - Acceptance: resumable after mid-run failure.

6. **Idempotent source upsert layer**
   - Upsert by `(tenant_id, source, external_id)` and payload hash diff.
   - Acceptance: rerun causes no duplicates.

7. **Normalization pipeline**
   - Convert source items into contacts + interactions.
   - Acceptance: deterministic output for fixed fixtures.

8. **Ingestion status endpoints**
   - `POST /ingestion/start`, `GET /ingestion/status`, `GET /coverage`.
   - Acceptance: UI can poll progress and completion.

9. **Daily scheduler job**
   - Schedule `daily_sync_job` once/day + manual refresh trigger.
   - Acceptance: sync_run entries created daily with status.

10. **Observability + M1 test gate**
    - Structured logs, sync metrics, error counts, lag metrics.
    - Add CI gate for migration + connector + idempotency tests.
    - Acceptance: CI fails on migration drift or failed integration tests.

## Exit Criteria
- User can connect Google account.
- 12-month backfill completes successfully.
- Contacts/interactions visible from normalized store.
- Daily sync runs with status tracking.
- M1 reliability tests pass in CI.
