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

const FIXED_NOW = new Date("2026-02-18T12:00:00.000Z").toISOString();
const FIXED_EMAIL_TIME = new Date("2026-02-17T12:00:00.000Z").toISOString();
const FIXED_MEETING_TIME = new Date("2026-02-16T12:00:00.000Z").toISOString();

class MockGoogleConnector implements GoogleConnector {
  async fetchGmail(): Promise<GmailItem[]> {
    return [
      {
        id: "gmail-1",
        updatedAt: FIXED_NOW,
        fromEmail: "alex@example.com",
        fromName: "Alex Example",
        subject: "Quarterly check-in",
        snippet: "Let's catch up next week",
        occurredAt: FIXED_EMAIL_TIME,
      },
    ];
  }

  async fetchCalendar(): Promise<CalendarItem[]> {
    return [
      {
        id: "cal-1",
        updatedAt: FIXED_NOW,
        organizerEmail: "sam@example.com",
        organizerName: "Sam Calendar",
        summary: "Project sync",
        occurredAt: FIXED_MEETING_TIME,
      },
    ];
  }
}

export function createGoogleConnector(): GoogleConnector {
  return new MockGoogleConnector();
}
