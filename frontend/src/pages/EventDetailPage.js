import React, { useMemo, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { getEventById, rsvpSession, cancelSession } from "../api";
import { useAuth } from "../contexts/AuthContext";
import useResource from "../hooks/useResource";
import { usePreferences } from "../contexts/PreferencesContext";
import {
  PageHeader,
  Loading,
  ErrorState,
  SaveButton,
  formatDate,
  formatTime,
  safeURL,
  downloadFile,
} from "../components/ui";
import EventMap, { hasCoordinates } from "../components/events/EventMap";
export function calendarFile(event) {
  const escape = (text) =>
    String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  if (!event.start) return null;
  const date = new Date(event.start);
  if (Number.isNaN(date.getTime())) return null;
  const stamp = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PlayAxis//Sporting Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${escape(event.id)}@playaxis`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(date)}`,
    `SUMMARY:${escape(event.name)}`,
    `LOCATION:${escape([event.venue, event.city].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${escape(event.description || "Check the event source for current details.")}`,
    ...(safeURL(event.url) ? [`URL:${safeURL(event.url)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines
    .map((line) => line.match(/.{1,70}/gu)?.join("\r\n ") || "")
    .join("\r\n");
}
export default function EventDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { saved, toggleSaved } = usePreferences();
  const [feedback, setFeedback] = useState("");
  const resource = useResource(`detail:${id}:${user?.id}`, () =>
    getEventById(id),
  );
  const snapshot =
    location.state?.event?.id === id
      ? location.state.event
      : saved.find((e) => e.id === id);
  const event = resource.data || snapshot;
  const center = useMemo(
    () =>
      hasCoordinates(event)
        ? [Number(event.latitude), Number(event.longitude)]
        : null,
    [event],
  );
  const points = useMemo(() => (event ? [event] : []), [event]);
  async function join() {
    setBusy(true);
    setFeedback("");
    try {
      await rsvpSession(event.session_id);
      resource.reload();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    try {
      await cancelSession(event.session_id);
      if (saved.some((e) => e.id === event.id)) toggleSaved(event);
      navigate("/local");
    } catch (e) {
      setFeedback(e.message);
      setBusy(false);
    }
  }
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: event.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setFeedback("Event link copied.");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        setFeedback("Copy the address from your browser to share this event.");
    }
  };
  if (resource.errorStatus === 404 && id.startsWith("local-"))
    return (
      <section className="panel empty-state">
        <h1>This session isn’t available.</h1>
        <p>It may have been removed by its organiser.</p>
        <Link className="button primary" to="/local">
          Find another session
        </Link>
      </section>
    );
  if (!event)
    return (
      <>
        <PageHeader title="Event details" />
        <>
          {resource.loading ? (
            <Loading />
          ) : (
            <ErrorState
              message={resource.error || "This event could not be found."}
              retry={resource.reload}
            />
          )}
        </>
        <Link className="button secondary" to="/events">
          Browse events
        </Link>
      </>
    );
  return (
    <>
      <Link
        className="text-link"
        to={
          id.startsWith("local-") ||
          id.startsWith("tm-") ||
          id.startsWith("localweb-")
            ? "/local"
            : "/events"
        }
      >
        All events
      </Link>
      <div style={{ height: 24 }} />
      <PageHeader
        eyebrow={event.league || event.sport}
        title={event.name || event.title}
      />
      <div className="detail-layout">
        <div className="page-stack">
          {(resource.error || resource.data?.stale) && (
            <div className="notice">
              <p>
                Showing previously loaded event details. Live updates are
                unavailable. Check the event source before making plans.
              </p>
              <button className="text-button" onClick={resource.reload}>
                Retry
              </button>
            </div>
          )}
          {safeURL(event.image) && (
            <img
              className="detail-visual panel"
              src={safeURL(event.image)}
              alt={event.name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <section className="panel panel-pad">
            <h2>About this event</h2>
            <p
              style={{ marginTop: 15, whiteSpace: "pre-wrap" }}
              className="muted"
            >
              {event.description ||
                `${event.name} is part of ${event.league || "the sporting calendar"}. Visit the event source for the latest schedule, venue information and admission details.`}
            </p>
            <p className="source-note">
              Source: {event.source || "Public sports feed"}. Times are shown in
              your local timezone. Event schedules can change.
            </p>
          </section>
          {center && (
            <section className="panel" style={{ height: 330 }}>
              <EventMap center={center} points={points} selected={event} />
            </section>
          )}
        </div>
        <aside className="panel" style={{ alignSelf: "start" }}>
          <div className="detail-facts">
            <div className="detail-fact">
              <CalendarDaysIcon />
              <div>
                <h3>
                  {event.date_text ||
                    formatDate(event.start, {
                      weekday: "long",
                      year: "numeric",
                    })}
                </h3>
                <p>{formatTime(event.start)} · Local time</p>
              </div>
            </div>
            <div className="detail-fact">
              <MapPinIcon />
              <div>
                <h3>{event.venue || "Venue to be confirmed"}</h3>
                <p>{[event.city, event.country].filter(Boolean).join(", ")}</p>
              </div>
            </div>
            {event.status && (
              <div className="detail-fact">
                <ClockIcon />
                <div>
                  <h3>Event status</h3>
                  <p>{event.status}</p>
                </div>
              </div>
            )}
            {event.session_id && (
              <section className="session-rsvp">
                <h3>
                  {event.attendees} going · Hosted by {event.host}
                </h3>
                {event.club_id && (
                  <Link className="text-link" to={`/clubs/${event.club_id}`}>
                    View the group
                  </Link>
                )}
                <div style={{ marginTop: 18 }}>
                  {user && resource.data?.owned ? (
                    <>
                      <p className="small muted">
                        You’re organising this session.
                      </p>
                      {confirmCancel ? (
                        <div className="form-actions">
                          <button
                            className="button secondary danger"
                            disabled={busy}
                            onClick={cancel}
                          >
                            Confirm cancellation
                          </button>
                          <button
                            className="text-button"
                            onClick={() => setConfirmCancel(false)}
                          >
                            Keep session
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-button danger"
                          style={{ marginTop: 12 }}
                          onClick={() => setConfirmCancel(true)}
                        >
                          Cancel this session
                        </button>
                      )}
                    </>
                  ) : user ? (
                    <button
                      className="button primary"
                      disabled={
                        busy ||
                        resource.loading ||
                        !!resource.error ||
                        !resource.data ||
                        new Date(event.start) < new Date()
                      }
                      onClick={join}
                    >
                      {busy
                        ? "Updating…"
                        : resource.data?.joined
                          ? "Leave this session"
                          : "Join this session"}
                    </button>
                  ) : (
                    <Link
                      className="button primary"
                      to={`/auth?next=${encodeURIComponent("/events/" + id)}`}
                    >
                      Sign in to join
                    </Link>
                  )}
                </div>
                {user && resource.data?.joined && (
                  <p className="source-note">
                    This session appears in your saved plans.
                  </p>
                )}
              </section>
            )}
            {event.price && (
              <div className="detail-fact">
                <div>
                  <h3>Listed admission</h3>
                  <p>{event.price}</p>
                </div>
              </div>
            )}
            {safeURL(event.url) && (
              <a
                className="button primary"
                href={safeURL(event.url)}
                target="_blank"
                rel="noreferrer"
              >
                Visit event source
              </a>
            )}
            {center && (
              <a
                className="button secondary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${center[0]},${center[1]}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            )}
            <SaveButton event={event} />
            <button
              className="button secondary"
              disabled={!calendarFile(event)}
              onClick={() => {
                const content = calendarFile(event);
                if (content)
                  downloadFile(
                    "playaxis-event.ics",
                    content,
                    "text/calendar;charset=utf-8",
                  );
              }}
            >
              Add to calendar
            </button>
            <button className="button secondary" onClick={share}>
              <ShareIcon />
              Share event
            </button>
            {feedback && (
              <p role="status" className="inline-feedback">
                {feedback}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
