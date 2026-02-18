import type { Contact, DashboardData, SyncRun, TimelineEvent } from "../types";
import { mockContacts, mockDashboard, mockTimelineByContact } from "./mockData";

const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

async function safeJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [statusRes, coverageRes] = await Promise.all([
    safeJson<{ ok: boolean; runs: SyncRun[] }>("/ingestion/status"),
    safeJson<{ ok: boolean; coverage: { contacts: number; interactions: number; sourceItems: number } }>("/coverage"),
  ]);

  const fallback = mockDashboard();

  return {
    syncStatus: {
      state: statusRes?.ok ? "Live" : fallback.syncStatus.state,
      latestRun: statusRes?.runs?.[0] ?? fallback.syncStatus.latestRun,
    },
    coverage: coverageRes?.ok
      ? {
          sourcesConnected: Math.min(3, Math.max(1, coverageRes.coverage.sourceItems > 0 ? 2 : 1)),
          totalSources: 3,
          contactsCovered: coverageRes.coverage.contacts,
          contactsTotal: Math.max(coverageRes.coverage.contacts, fallback.coverage.contactsTotal),
        }
      : fallback.coverage,
    reminders: fallback.reminders,
    mergeSuggestions: fallback.mergeSuggestions,
  };
}

export async function getContacts(query?: string): Promise<Contact[]> {
  const q = query?.trim().toLowerCase();
  if (!q) return mockContacts;
  return mockContacts.filter((c) => [c.name, c.company, c.email, c.title].join(" ").toLowerCase().includes(q));
}

export async function getContactById(id: string): Promise<Contact | null> {
  return mockContacts.find((c) => c.id === id) ?? null;
}

export async function getTimeline(contactId: string): Promise<TimelineEvent[]> {
  return mockTimelineByContact[contactId] ?? [];
}
