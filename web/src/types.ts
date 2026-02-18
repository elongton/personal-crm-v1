export type Loadable<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

export type SyncRun = {
  runId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  kind: "backfill" | "daily";
};

export type CoverageSummary = {
  sourcesConnected: number;
  totalSources: number;
  contactsCovered: number;
  contactsTotal: number;
};

export type Reminder = {
  id: string;
  contactId: string;
  contactName: string;
  reason: string;
  dueAt: string;
};

export type MergeSuggestion = {
  id: string;
  primaryName: string;
  duplicateName: string;
  confidence: number;
};

export type Contact = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  lastTouchAt?: string;
  healthScore: number;
};

export type TimelineEvent = {
  id: string;
  type: "email" | "meeting" | "note";
  text: string;
  at: string;
};

export type DashboardData = {
  syncStatus: { state: string; latestRun?: SyncRun };
  coverage: CoverageSummary;
  reminders: Reminder[];
  mergeSuggestions: MergeSuggestion[];
};
