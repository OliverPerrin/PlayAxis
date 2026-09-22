import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import { getSessions } from "../api";
import {
  PageHeader,
  EventCard,
  EmptyState,
  ResourceState,
  safeURL,
} from "../components/ui";
import EventCalendar from "../components/events/EventCalendar";
import { SessionCard } from "./LocalEventsPage";
export default function SavedPage() {
  const { user } = useAuth();
  const { saved, savedPlaces, togglePlace } = usePreferences();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "events";
  const setTab = (value) => setParams({ tab: value });
  const [calendar, setCalendar] = useState(false);
  const sessions = useResource(user ? `joined:${user.id}` : null, () =>
    getSessions("", "", true),
  );
  return (
    <>
      <PageHeader
        eyebrow="01 / PLAY"
        title="A few good plans."
        description="The events and places you want to come back to, plus the sessions you’ve joined."
      />
      <div className="segmented">
        {[
          ["events", `Saved events (${saved.length})`],
          ["places", `Saved places (${savedPlaces.length})`],
          ["joined", "Joined sessions"],
        ].map(([id, text]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {text}
          </button>
        ))}
      </div>
      {tab === "events" ? (
        <>
          {saved.length ? (
            <>
              <div className="section-title">
                <p className="small muted">Saved on this device</p>
                <button
                  className="text-button"
                  onClick={() => setCalendar((v) => !v)}
                >
                  {calendar ? "Show list" : "Show calendar"}
                </button>
              </div>
              {calendar ? (
                <EventCalendar events={saved.filter((e) => e.start)} />
              ) : (
                <section className="panel panel-pad">
                  {saved.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </section>
              )}
            </>
          ) : (
            <section className="panel">
              <EmptyState
                title="Save something to look forward to."
                action={
                  <Link className="button primary" to="/local">
                    Find an event
                  </Link>
                }
              >
                Use the bookmark on an event to keep it here.
              </EmptyState>
            </section>
          )}
        </>
      ) : tab === "places" ? (
        savedPlaces.length ? (
          <div className="three-columns">
            {savedPlaces.map((place) => (
              <article className="panel club-card" key={place.id}>
                <p className="eyebrow">{place.kind || "Place to play"}</p>
                <h2>{place.name}</h2>
                <p>{place.sport || place.address}</p>
                <div className="club-actions">
                  <Link
                    className="text-link"
                    to="/sessions/new"
                    state={{ place }}
                  >
                    Plan a session here
                  </Link>
                  <button
                    className="text-button"
                    onClick={() => togglePlace(place)}
                  >
                    Unsave
                  </button>
                </div>
                <a
                  className="text-link"
                  style={{ marginTop: 15 }}
                  href={safeURL(place.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Place details
                </a>
              </article>
            ))}
          </div>
        ) : (
          <section className="panel">
            <EmptyState
              title="Keep a few good spots close."
              action={
                <Link className="button primary" to="/map">
                  Explore the map
                </Link>
              }
            >
              Save a place from the map to find it again easily.
            </EmptyState>
          </section>
        )
      ) : !user ? (
        <section className="panel">
          <EmptyState
            title="Your next session is waiting."
            action={
              <Link className="button primary" to="/auth?next=/saved">
                Sign in
              </Link>
            }
          >
            Sign in to see the community sessions you have joined.
          </EmptyState>
        </section>
      ) : (
        <ResourceState resource={sessions}>
          {sessions.data?.events?.length ? (
            <div className="session-grid">
              {sessions.data.events.map((event) => (
                <SessionCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <section className="panel">
              <EmptyState
                title="Find your next good day."
                action={
                  <Link className="button primary" to="/local">
                    Browse sessions
                  </Link>
                }
              >
                When you join a session, it appears here.
              </EmptyState>
            </section>
          )}
        </ResourceState>
      )}
    </>
  );
}
