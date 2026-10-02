import React from "react";
import { Link } from "react-router-dom";
import { formatDate, formatTime } from "../ui";

export default function SessionCard({ event }) {
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
