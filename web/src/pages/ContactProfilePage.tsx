import { useEffect, useState } from "react";
import { getContactById, getTimeline } from "../lib/api";
import type { Contact, Loadable, TimelineEvent } from "../types";
import { StateView } from "../components/StateView";

type Props = { contactId: string };

export function ContactProfilePage({ contactId }: Props) {
  const [contactState, setContactState] = useState<Loadable<Contact | null>>({ status: "loading" });
  const [timelineState, setTimelineState] = useState<Loadable<TimelineEvent[]>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getContactById(contactId)
      .then((contact) => {
        if (!cancelled) setContactState({ status: "success", data: contact });
      })
      .catch((error) => {
        if (!cancelled) setContactState({ status: "error", error: error instanceof Error ? error.message : "Failed loading contact" });
      });

    getTimeline(contactId)
      .then((items) => {
        if (!cancelled) setTimelineState({ status: "success", data: items });
      })
      .catch((error) => {
        if (!cancelled) setTimelineState({ status: "error", error: error instanceof Error ? error.message : "Failed loading timeline" });
      });

    return () => {
      cancelled = true;
    };
  }, [contactId]);

  if (contactState.status === "loading") return <StateView title="Loading contact profile…" />;
  if (contactState.status === "error") return <StateView title="Could not load profile" subtitle={contactState.error} />;
  if (!contactState.data) return <StateView title="Contact not found" subtitle="This contact may have been deleted or not indexed yet." />;

  const contact = contactState.data;
  return (
    <section className="stack-lg">
      <article className="card">
        <h2>{contact.name}</h2>
        <p className="muted">{contact.title} · {contact.company}</p>
        <p>{contact.email}</p>
        <div className="health">
          <span>Relationship health score</span>
          <strong>{contact.healthScore}</strong>
        </div>
      </article>

      <article className="card">
        <h3>Timeline</h3>
        {timelineState.status === "loading" ? (
          <StateView title="Loading activity…" />
        ) : timelineState.status === "error" ? (
          <StateView title="Could not load timeline" subtitle={timelineState.error} />
        ) : timelineState.data.length === 0 ? (
          <StateView title="No timeline events yet" subtitle="Activity will appear here after sync and enrichment." />
        ) : (
          <ul className="list">
            {timelineState.data.map((item) => (
              <li key={item.id}>
                <span className="pill subtle">{item.type}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
