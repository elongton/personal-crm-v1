import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { ContactProfilePage } from "./pages/ContactProfilePage";
import { ContactsPage } from "./pages/ContactsPage";
import { DashboardPage } from "./pages/DashboardPage";

type Route = { page: "dashboard" | "contacts" | "contact"; contactId?: string };

function parseRoute(pathname: string): Route {
  if (pathname === "/contacts") return { page: "contacts" };
  if (pathname.startsWith("/contacts/")) {
    const id = pathname.replace("/contacts/", "").trim();
    return id ? { page: "contact", contactId: id } : { page: "contacts" };
  }
  return { page: "dashboard" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const title = useMemo(() => {
    if (route.page === "contacts") return "Contacts";
    if (route.page === "contact") return "Contact profile";
    return "Dashboard";
  }, [route.page]);

  function navigate(path: string) {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setRoute(parseRoute(path));
  }

  return (
    <main className="app-shell">
      <aside className="side-nav">
        <h1>Personal CRM</h1>
        <button className={route.page === "dashboard" ? "active" : ""} onClick={() => navigate("/")}>Dashboard</button>
        <button className={route.page !== "dashboard" ? "active" : ""} onClick={() => navigate("/contacts")}>Contacts</button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h2>{title}</h2>
            <p className="muted">MVP UI shell (v1)</p>
          </div>
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              if (route.page !== "contacts") navigate("/contacts");
            }}
          />
        </header>

        {route.page === "dashboard" ? <DashboardPage onOpenContact={(id) => navigate(`/contacts/${id}`)} /> : null}
        {route.page === "contacts" ? <ContactsPage query={search} onOpenContact={(id) => navigate(`/contacts/${id}`)} /> : null}
        {route.page === "contact" && route.contactId ? <ContactProfilePage contactId={route.contactId} /> : null}
      </section>
    </main>
  );
}
