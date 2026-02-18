# COUNCIL_DECISION_v1

1) **Problem Definition**  
Build an automated, low-noise personal CRM that consolidates fragmented relationship signals from Gmail and Calendar into unified contact intelligence, so one professional user can reliably track relationship health, recent interactions, and follow-up opportunities without manual logkeeping.

2) **Target User**  
A single professional individual user managing a high volume of relationship interactions across email and meetings, with no team/multi-user requirements in MVP.

3) **Success Criteria**  
- **Coverage:** ≥90% of active contacts from Gmail+Calendar (12-month backfill + daily sync) represented in CRM profiles.  
- **Noise Precision:** ≤15% of surfaced reminders/insights marked as irrelevant by user feedback.  
- **Dedupe Precision:** ≥95% correctness on merge suggestions accepted by user (manual-confirmation flow).  
- **Query Relevance:** ≥80% of top-5 results judged relevant for natural-language relationship queries.  
- **Actionability:** ≥60% of reminder cards lead to user action (dismiss, snooze, or complete).  
- **Latency:** Dashboard/profile load <2s p95; scheduled sync completion within defined daily window.

4) **Explicit Non-Goals**  
- Box integration in MVP.  
- Real-time sync/event streaming in MVP (daily scheduled sync only).  
- Fully automatic contact merges (manual review/confirmation required).  
- Team collaboration, shared workspaces, or multi-tenant enterprise features.  
- Broad compliance certification expansion beyond agreed MVP target.  
- Complex workflow automation beyond core reminders and profile/dashboard use cases.

5) **UX Flow Summary**  
- **Onboarding/Connect:** User connects Gmail and Calendar; sees permission status and sync scope.  
- **Initial Processing:** System runs 12-month backfill with progress, partial-state handling, and recoverable error states.  
- **Coverage Review:** User sees imported contact coverage and data freshness indicators.  
- **Merge Review Queue:** Suggested duplicates shown with confidence/context; user approves/rejects manually.  
- **Dashboard:** Prioritized reminders, relationship health indicators, and recent interaction summaries.  
- **Profile View:** Per-contact timeline, key metadata, and suggested next actions.  
- **Reminder Interaction:** User can complete, snooze, or dismiss reminders with feedback capture.  
- **Natural-Language Search:** Embeddings-based query interface returns ranked contacts/interactions with relevance signals.  
- **MVP Simplicity Cuts Applied:** Reduced optional branches and complexity per Phase 6 validation conditions.

6) **Technical Architecture Summary**  
- **Data Sources:** Gmail + Google Calendar connectors with OAuth scopes aligned to approved use.  
- **Ingestion Model:** 12-month initial backfill, then daily scheduled sync jobs (no real-time listeners in MVP).  
- **Pipeline:** Extract → normalize → identity resolution candidate generation → manual merge suggestion queue → profile materialization → reminder scoring.  
- **Core Data Model (minimum):** Contact, Interaction (email/meeting), Account/Identity mapping, MergeSuggestion, Reminder, HealthScore, SyncJob/Run metadata.  
- **Search:** Embeddings index for natural-language retrieval over contacts/interactions.  
- **Application Layer:** Dashboard/profile/reminder/search APIs with job-status and freshness endpoints.  
- **Operations:** Scheduled workers, retry/idempotency controls, observability for sync drift/quota errors, and deployment plan aligned to M1/M2/M3 sequencing.  
- **Quality Gates:** Unit/integration tests for parsing, dedupe suggestion logic, ranking relevance, and end-to-end sync workflows.

7) **Identified Risks**  
- API quota/rate limits impacting backfill and daily sync reliability.  
- Sync drift/data freshness gaps due to scheduled (non-real-time) architecture.  
- Dedupe suggestion errors causing trust loss if confidence calibration is weak.  
- Privacy/security risk from storing sensitive relationship metadata/content.  
- Operational complexity in job orchestration, retries, and partial-failure recovery.  
- Reminder fatigue/noise if scoring thresholds are not tuned.  
- Scope re-expansion pressure (deferred integrations/features) before MVP quality targets are met.

8) **Open Questions**  
- Finalized OAuth scope boundaries and least-privilege implementation details.  
- Data retention/deletion policy (content vs metadata, retention duration, purge guarantees).  
- Merge policy edge cases (conflicting identities, ambiguous same-name contacts).  
- Reminder delivery channel details and notification cadence defaults.  
- Compliance target definition for MVP release gate.  
- Acceptable daily sync time window and SLA thresholds for “fresh enough” data.  
- Human-feedback loop design for improving search relevance and noise precision over time.

9) **First Implementation Milestone**  
**M1: MVP Foundation (build + internal validation)**  
Deliver end-to-end core path: Gmail+Calendar connect, 12-month backfill, daily scheduled sync, unified contact profiles, manual merge suggestion queue, baseline dashboard/profile/reminders, and embeddings-based NL query—validated against initial coverage/noise/dedupe/relevance/latency targets with the approved Phase 6 acceptance checklist.
