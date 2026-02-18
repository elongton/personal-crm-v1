import { useEffect, useState } from "react";
import { getDashboardData } from "../lib/api";
import type { DashboardData, Loadable } from "../types";
import { StateView } from "../components/StateView";
import { StatusCard } from "../components/StatusCard";

type Props = { onOpenContact: (contactId: string) => void };

export function DashboardPage({ onOpenContact }: Props) {
  const [state, setState] = useState<Loadable<DashboardData>>({ status: "loading" });

  async function load() {
    setState({ status: "loading" });
    try {
      const data = await getDashboardData();
      setState({ status: "success", data });
    } catch (error) {
      setState({ status: "error", error: error instanceof Error ? error.message : "Failed to load dashboard" });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <StateView title="Loading dashboard…" subtitle="Pulling latest CRM snapshots." />;
  if (state.status === "error") return <StateView title="Could not load dashboard" subtitle={state.error} action={<button onClick={load}>Retry</button>} />;

  const { syncStatus, coverage, reminders, mergeSuggestions } = state.data;

  return (
    <section className="stack-lg">
      <div className="grid cols-2">
        <StatusCard
          title="Sync status"
          value={<span className="pill">{syncStatus.state}</span>}
          hint={syncStatus.latestRun ? `Latest: ${syncStatus.latestRun.kind} (${syncStatus.latestRun.status})` : "No runs yet"}
        />
        <StatusCard
          title="Coverage"
          value={`${coverage.contactsCovered}/${coverage.contactsTotal}`}
          hint={`${coverage.sourcesConnected}/${coverage.totalSources} sources connected`}
        />
      </div>

      <div className="grid cols-2">
        <article className="card">
          <h3>Due reminders</h3>
          {reminders.length ? (
            <ul className="list">
              {reminders.map((r) => (
                <li key={r.id}>
                  <button className="link-btn" onClick={() => onOpenContact(r.contactId)}>
                    {r.contactName}
                  </button>
                  <span>{r.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <StateView title="No reminders due" subtitle="You’re all caught up." />
          )}
        </article>

        <article className="card">
          <h3>Merge suggestions</h3>
          {mergeSuggestions.length ? (
            <ul className="list">
              {mergeSuggestions.map((m) => (
                <li key={m.id}>
                  <span>{m.primaryName}</span>
                  <span className="muted">possible duplicate: {m.duplicateName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <StateView title="No duplicates found" subtitle="Identity graph is clean." />
          )}
        </article>
      </div>
    </section>
  );
}
