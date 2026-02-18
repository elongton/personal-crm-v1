import { runSync } from "./service";

const DEFAULT_TENANT = "00000000-0000-0000-0000-000000000001";

export function startDailyScheduler(): NodeJS.Timeout | null {
  const enabled = process.env.ENABLE_DAILY_SCHEDULER === "true";
  if (!enabled) return null;

  const intervalMs = Number(process.env.DAILY_SYNC_INTERVAL_MS ?? 24 * 3600 * 1000);
  return setInterval(async () => {
    const end = new Date();
    const start = new Date(Date.now() - 24 * 3600 * 1000);
    try {
      await runSync({
        tenantId: process.env.DEFAULT_TENANT_ID ?? DEFAULT_TENANT,
        kind: "daily",
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      });
    } catch {
      // keep scheduler alive
    }
  }, intervalMs);
}
