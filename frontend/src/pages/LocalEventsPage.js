import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import { getSessions, searchLocalEvents } from "../api";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  EventCard,
  formatDate,
  formatTime,
  SourceNote,
  safeURL,
} from "../components/ui";
import LocationSearch from "../components/LocationSearch";
import { dateWindow, withinDates } from "../utils/eventDates";
import { ACTIVITIES } from "../utils/workouts";
export function SessionCard({ event }) {
  return (
    <article className="panel session-card">
      <span className="date-label">
        {formatDate(event.start, { weekday: "short" })} ·{" "}
        {formatTime(event.start)}
      </span>
      <h3>{event.name}</h3>
      <div className="session-meta">
        <span>{event.sport}</span>
        <span>
          {event.venue}, {event.city}
        </span>
      </div>
      <p>
        {event.description?.slice(0, 170)}
        {event.description?.length > 170 ? "…" : ""}
      </p>
      <footer>
        <Link
          className="button secondary"
          to={`/events/${event.id}`}
          state={{ event }}
        >
          View session
        </Link>
        <span className="small muted">
          {event.attendees} going{event.joined ? " · You’re in" : ""}
        </span>
      </footer>
    </article>
  );
}
export default function LocalEventsPage() {
  const { preferences, update } = usePreferences();
  const [sport, setSport] = useState("");
  const [period, setPeriod] = useState("any");
  const [custom, setCustom] = useState({ date_from: "", date_to: "" });
  const [search, setSearch] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sessionCount, setSessionCount] = useState(6);
  const [showLocation, setShowLocation] = useState(false);
  const city = preferences.location;
  const timeZone =
    city.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const dates =
    period === "custom"
      ? Object.fromEntries(Object.entries(custom).filter(([, value]) => value))
      : dateWindow(period, timeZone);
  const invalidDates =
    dates.date_from && dates.date_to && dates.date_to < dates.date_from;
  const sessions = useResource(
    `sessions:${city.name}:${sport}:${dates.date_from}:${dates.date_to}:${timeZone}`,
    () =>
      getSessions(
        city.name === "Your location" ? "" : city.name,
        sport,
        false,
        { ...dates, tz: timeZone },
      ),
  );
  const external = useResource(search ? JSON.stringify(search) : null, () =>
    searchLocalEvents(search.location, search.sport, search.dates),
  );
  useEffect(() => {
    setSearch(null);
    setVisibleCount(12);
    setSessionCount(6);
  }, [
    city.name,
    city.country,
    sport,
    period,
    custom.date_from,
    custom.date_to,
  ]);
  function find() {
    const next = { location: city, sport: sport || "all", dates };
    if (JSON.stringify(next) === JSON.stringify(search)) external.reload();
    else setSearch(next);
  }
  const visibleSessions = (sessions.data?.events || []).filter((event) =>
    withinDates(event, dates, timeZone),
  );
  return (
    <>
      <PageHeader eyebrow="01 / PLAY" title="What’s happening nearby?">
        <Link className="button primary" to="/sessions/new">
          Organise a session
        </Link>
      </PageHeader>
      <div className="local-search-controls">
        <button
          className="button secondary"
          aria-expanded={showLocation}
          onClick={() => setShowLocation((v) => !v)}
        >
          {city.name} · Change
        </button>
        <label>
          What
          <select
            aria-label="Activity type"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="">All events & activities</option>
            <option value="sports">All sport</option>
            <option value="music">Music & concerts</option>
            <option value="arts">Arts & theatre</option>
            {ACTIVITIES.map((s) => (
              <option value={s} key={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          When
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="any">Any upcoming date</option>
            <option value="today">Today</option>
            <option value="weekend">This weekend</option>
            <option value="week">Next 7 days</option>
            <option value="custom">Choose dates</option>
          </select>
        </label>
        <button
          className="button primary"
          disabled={external.loading || invalidDates}
          onClick={find}
        >
          {external.loading ? "Finding events…" : "Search local events"}
        </button>
        {period === "custom" && (
          <div className="local-date-inputs">
            <label>
              From
              <input
                type="date"
                value={custom.date_from}
                onChange={(e) =>
                  setCustom({ ...custom, date_from: e.target.value })
                }
              />
            </label>
            <label>
              To
              <input
                type="date"
                min={custom.date_from}
                value={custom.date_to}
                onChange={(e) =>
                  setCustom({ ...custom, date_to: e.target.value })
                }
              />
            </label>
          </div>
        )}
      </div>
      {invalidDates && (
        <p className="notice" role="alert">
          Choose an end date on or after the start date.
        </p>
      )}
      {showLocation && (
        <section className="panel panel-pad" style={{ marginBottom: 25 }}>
          <LocationSearch
            onSelect={(location) => {
              update({ location });
              setShowLocation(false);
              setSearch(null);
            }}
          />
        </section>
      )}
      <section className="panel panel-pad" style={{ marginBottom: 28 }}>
        <div className="section-title">
          <div>
            <h2>Events & experiences</h2>
            <p className="small muted">
              {city.name} ·{" "}
              {period === "any"
                ? "All upcoming dates"
                : `${dates.date_from || "Now"} to ${dates.date_to || "any date"}`}{" "}
              · Times shown in your local timezone
            </p>
          </div>
        </div>
        {search ? (
          <ResourceState resource={external}>
            {external.data?.events?.length ? (
              <div className="event-list">
                {external.data.events.slice(0, visibleCount).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : external.data?.organisers?.length ? (
              <>
                <div className="section-title">
                  <div>
                    <h3>Explore local organisers</h3>
                    <p>
                      Check dates on the organiser’s website. Website results
                      are not filtered by date.
                    </p>
                  </div>
                </div>
                <div className="organiser-list">
                  {external.data.organisers.map((item) => (
                    <article key={item.id}>
                      <span className="small muted">{item.domain}</span>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <a
                        className="text-link"
                        href={safeURL(item.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Browse organiser
                      </a>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Nothing matched this search.">
                Try all activities or a nearby city. You can also organise a
                session of your own.
              </EmptyState>
            )}
          </ResourceState>
        ) : (
          <p className="source-note">
            Search Ticketmaster events and local organiser websites.
          </p>
        )}
        {external.data?.events?.length > visibleCount && (
          <button
            className="button secondary"
            style={{ marginTop: 22 }}
            onClick={() => setVisibleCount((n) => n + 12)}
          >
            Show more events
          </button>
        )}
        <SourceNote data={external.data} />
        {external.data?.total > external.data?.events?.length && (
          <p className="source-note">
            Showing {Math.min(visibleCount, external.data.events.length)} of{" "}
            {external.data.total} matching listings. Choose a specific activity
            to narrow the search.
          </p>
        )}
      </section>
      <section style={{ marginBottom: 35 }}>
        <div className="section-title">
          <div>
            <h2>Community sessions</h2>
          </div>
          <button className="text-button" onClick={sessions.reload}>
            Refresh
          </button>
        </div>
        <ResourceState resource={sessions}>
          {visibleSessions.length ? (
            <div className="session-grid">
              {visibleSessions.slice(0, sessionCount).map((event) => (
                <SessionCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <section className="panel">
              <EmptyState
                title="Make the first plan."
                action={
                  <Link className="button primary" to="/sessions/new">
                    Start a local session
                  </Link>
                }
              >
                No sessions match these filters yet.
              </EmptyState>
            </section>
          )}
        </ResourceState>
        {visibleSessions.length > sessionCount && (
          <button
            className="button secondary"
            style={{ marginTop: 22 }}
            onClick={() => setSessionCount((n) => n + 6)}
          >
            Show more sessions
          </button>
        )}
      </section>
    </>
  );
}
