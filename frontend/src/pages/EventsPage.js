import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import { getEvents } from "../api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  ResourceState,
  EventCard,
  EmptyState,
  SearchField,
} from "../components/ui";
import EventCalendar from "../components/events/EventCalendar";
import { LEAGUES } from "../utils/sports";
export default function EventsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const sport = params.get("sport") || "";
  const [query, setQuery] = useState(q);
  const [visibleCount, setVisibleCount] = useState(30);
  const [view, setView] = useState("list");
  const [onlySaved, setOnlySaved] = useState(false);
  const { saved } = usePreferences();
  useEffect(() => {
    setQuery(q);
    setVisibleCount(30);
  }, [q, sport]);
  const resource = useResource(`events:${q}:${sport}`, () =>
    getEvents(q, null, null, { sport }),
  );
  const items = onlySaved
    ? saved.filter(
        (e) =>
          (!q ||
            `${e.name} ${e.venue} ${e.league}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!sport || e.league === LEAGUES.find((l) => l.key === sport)?.name),
      )
    : resource.data?.events || [];
  const update = (name, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next);
  };
  return (
    <>
      <PageHeader eyebrow="Be part of it" title="The sporting calendar" />
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          if (q === query.trim()) resource.reload();
          else update("q", query.trim());
        }}
      >
        <SearchField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, venues or cities"
          label="Search events"
        />
        <select
          aria-label="Filter by league"
          value={sport}
          onChange={(e) => update("sport", e.target.value)}
        >
          <option value="">All available leagues</option>
          {LEAGUES.map((l) => (
            <option key={l.key} value={l.key}>
              {l.name}
            </option>
          ))}
        </select>
        <button className="button primary">Search events</button>
      </form>
      <div className="section-title">
        <div className="segmented" style={{ marginBottom: 0 }}>
          <button
            className={view === "list" ? "active" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List view
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
        </div>
        <label
          className="small"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            margin: 0,
            fontWeight: 400,
          }}
        >
          <input
            style={{ margin: 0, width: 17 }}
            type="checkbox"
            checked={onlySaved}
            onChange={(e) => setOnlySaved(e.target.checked)}
          />
          Saved ({saved.length})
        </label>
      </div>
      {onlySaved ? (
        <p className="source-note" style={{ marginBottom: 20 }}>
          Saved on this device. Open an event for its latest source information.
        </p>
      ) : (
        resource.data?.unavailable?.length > 0 && (
          <div className="notice">
            <p>
              Some feeds are unavailable: {resource.data.unavailable.join(", ")}
              . Other results are shown below.
            </p>
            <button className="text-button" onClick={resource.reload}>
              Retry
            </button>
          </div>
        )
      )}
      <ResourceState resource={onlySaved ? { loading: false } : resource}>
        {items.length ? (
          view === "calendar" ? (
            <EventCalendar events={items} />
          ) : (
            <section className="panel panel-pad">
              <div className="section-title">
                <p className="mini-heading">
                  {items.length}{" "}
                  {onlySaved ? "saved events" : "upcoming fixtures"}
                </p>
                <span className="small muted">Your local time</span>
              </div>
              <div className="event-list">
                {items.slice(0, visibleCount).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {items.length > visibleCount && (
                <button
                  className="button secondary"
                  style={{ marginTop: 24 }}
                  onClick={() => setVisibleCount((n) => n + 30)}
                >
                  Show more events ({items.length - visibleCount} remaining)
                </button>
              )}
            </section>
          )
        ) : (
          <section className="panel">
            <EmptyState
              title={
                onlySaved
                  ? "Your calendar, your favourites"
                  : "No matching upcoming events"
              }
            >
              {onlySaved
                ? "Use the bookmark on an event to save it here."
                : "Try a team name, another league, or clear your search. Free feeds do not cover every sport or city."}
            </EmptyState>
          </section>
        )}
      </ResourceState>
      {!onlySaved && resource.data?.sources && (
        <p className="source-note">
          {resource.data.sources
            .map((s) => `${s.name}: ${s.coverage}`)
            .join(". ")}
          .
        </p>
      )}
    </>
  );
}
