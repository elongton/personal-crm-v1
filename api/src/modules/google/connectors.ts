import { config } from "../../lib/config";

export interface GmailItem {
  id: string;
  updatedAt: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  occurredAt: string;
}

export interface CalendarItem {
  id: string;
  updatedAt: string;
  organizerEmail: string;
  organizerName: string;
  summary: string;
  occurredAt: string;
}

export interface GoogleConnector {
  fetchGmail(params: { tenantId: string; startIso: string; endIso: string }): Promise<GmailItem[]>;
  fetchCalendar(params: { tenantId: string; startIso: string; endIso: string }): Promise<CalendarItem[]>;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function occurredAtForWindow(startIso: string): string {
  const start = new Date(startIso);
  start.setUTCDate(Math.min(15, start.getUTCDate()));
  return start.toISOString();
}

class MockGoogleConnector implements GoogleConnector {
  async fetchGmail(params: { tenantId: string; startIso: string }): Promise<GmailItem[]> {
    const month = monthKey(params.startIso);
    return [
      {
        id: `gmail-${month}`,
        updatedAt: params.startIso,
        fromEmail: "alex@example.com",
        fromName: "Alex Example",
        subject: `Quarterly check-in (${month})`,
        snippet: "Let's catch up next week",
        occurredAt: occurredAtForWindow(params.startIso),
      },
    ];
  }

  async fetchCalendar(params: { tenantId: string; startIso: string }): Promise<CalendarItem[]> {
    const month = monthKey(params.startIso);
    return [
      {
        id: `cal-${month}`,
        updatedAt: params.startIso,
        organizerEmail: "sam@example.com",
        organizerName: "Sam Calendar",
        summary: `Project sync (${month})`,
        occurredAt: occurredAtForWindow(params.startIso),
      },
    ];
  }
}

class StubGoogleConnector implements GoogleConnector {
  async fetchGmail(): Promise<GmailItem[]> {
    // TODO(task-4): implement real Gmail adapter with pagination + retry/backoff.
    throw new Error("GOOGLE_CONNECTOR_MODE=real is not implemented yet");
  }

  async fetchCalendar(): Promise<CalendarItem[]> {
    // TODO(task-4): implement real Calendar adapter with pagination + retry/backoff.
    throw new Error("GOOGLE_CONNECTOR_MODE=real is not implemented yet");
  }
}

export function createGoogleConnector(): GoogleConnector {
  const mode = process.env.GOOGLE_CONNECTOR_MODE ?? (config.googleAuthMode === "mock" ? "mock" : "real");
  return mode === "mock" ? new MockGoogleConnector() : new StubGoogleConnector();
}
