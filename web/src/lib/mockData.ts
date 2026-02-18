import type { Contact, DashboardData, TimelineEvent } from "../types";

export const mockContacts: Contact[] = [
  {
    id: "c_anna_01",
    name: "Anna Park",
    title: "VP Product",
    company: "Northline",
    email: "anna@northline.com",
    lastTouchAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    healthScore: 88,
  },
  {
    id: "c_miguel_02",
    name: "Miguel Torres",
    title: "Founder",
    company: "Helio Labs",
    email: "miguel@heliolabs.io",
    lastTouchAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    healthScore: 61,
  },
  {
    id: "c_sam_03",
    name: "Samira Chen",
    title: "Head of Partnerships",
    company: "Arbor Health",
    email: "samira@arbor.health",
    lastTouchAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    healthScore: 77,
  },
];

export const mockTimelineByContact: Record<string, TimelineEvent[]> = {
  c_anna_01: [
    { id: "e1", type: "email", text: "Followed up on Q2 roadmap collaboration.", at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: "e2", type: "meeting", text: "Product sync call; action item: intro to GTM lead.", at: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString() },
  ],
  c_miguel_02: [{ id: "e3", type: "note", text: "Potential investor intro if pilot lands.", at: new Date(Date.now() - 13 * 24 * 3600 * 1000).toISOString() }],
  c_sam_03: [],
};

export const mockDashboard = (): DashboardData => ({
  syncStatus: {
    state: "Healthy",
    latestRun: {
      runId: "run_demo_001",
      status: "completed",
      startedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
      kind: "daily",
    },
  },
  coverage: {
    sourcesConnected: 2,
    totalSources: 3,
    contactsCovered: 214,
    contactsTotal: 280,
  },
  reminders: [
    {
      id: "r1",
      contactId: "c_miguel_02",
      contactName: "Miguel Torres",
      reason: "No touchpoint in 10+ days",
      dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    },
    {
      id: "r2",
      contactId: "c_sam_03",
      contactName: "Samira Chen",
      reason: "Partnership proposal follow-up",
      dueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    },
  ],
  mergeSuggestions: [
    {
      id: "m1",
      primaryName: "Anna Park",
      duplicateName: "A. Park (Northline)",
      confidence: 0.92,
    },
  ],
});
