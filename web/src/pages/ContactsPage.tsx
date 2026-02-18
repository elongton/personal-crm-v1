import { useEffect, useState } from "react";
import { getContacts } from "../lib/api";
import type { Contact, Loadable } from "../types";
import { StateView } from "../components/StateView";

type Props = { query: string; onOpenContact: (contactId: string) => void };

export function ContactsPage({ query, onOpenContact }: Props) {
  const [state, setState] = useState<Loadable<Contact[]>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getContacts(query)
      .then((data) => {
        if (cancelled) return;
        setState({ status: "success", data });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ status: "error", error: error instanceof Error ? error.message : "Failed to load contacts" });
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (state.status === "loading") return <StateView title="Loading contacts…" />;
  if (state.status === "error") return <StateView title="Could not load contacts" subtitle={state.error} />;
  if (state.data.length === 0) return <StateView title="No contacts found" subtitle="Try a different name, company, or email." />;

  return (
    <section className="card">
      <h2>Contacts</h2>
      <ul className="contact-list">
        {state.data.map((c) => (
          <li key={c.id}>
            <button className="link-btn strong" onClick={() => onOpenContact(c.id)}>
              {c.name}
            </button>
            <span>{c.title} · {c.company}</span>
            <span className="muted">{c.email}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
