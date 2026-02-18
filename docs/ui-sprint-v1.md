# UI Sprint v1 (Council Output)

## 1) PM Scope (shippable today)
**Goal:** deliver a demoable CRM UI shell using existing backend where possible and safe mock data elsewhere.

### In scope
- Dashboard with cards: sync status, coverage, due reminders, merge suggestions
- Contacts list page
- Contact profile page with health score + timeline placeholder
- Basic global search UX
- Consistent loading/empty/error states
- Responsive, clean styling for modern MVP presentation

### Out of scope (deferred)
- Contact CRUD mutations
- Real global search index service
- Real merge action workflow
- Rich timeline composer and activity ingestion UI

## 2) Designer Spec
### Information architecture
- Left nav: Dashboard, Contacts
- Top bar: page title + global search

### Screen details
1. **Dashboard**
   - Row 1 cards: Sync Status, Coverage
   - Row 2 cards: Due Reminders list, Merge Suggestions list
2. **Contacts**
   - Search-filtered list with name, role/company, email
   - Empty state when no matches
3. **Contact Profile**
   - Header card: identity + health score
   - Timeline card: list events or placeholder

### UX states
- Loading skeleton-like panel per page
- Empty state copy for no data
- Error state copy + retry on dashboard fetch

### Visual style
- Soft neutral background, white cards, rounded corners
- Blue accents for links/status pills
- Responsive collapse for mobile widths

## 3) Moderator Validation + Acceptance Checklist
- [x] Dashboard shows all 4 required card groups
- [x] Contacts list implemented and navigable
- [x] Contact profile implemented with timeline placeholder and health score
- [x] Search input present and usable in UX flow
- [x] Loading/empty/error states implemented in main flows
- [x] Uses existing endpoints where available (`/ingestion/status`, `/coverage`)
- [x] Missing backend domains safely mocked (contacts/timeline/reminders/merge)
- [x] README updated with local run instructions and screenshot steps

**Result:** Scope passes acceptance for MVP UI v1 demo.
