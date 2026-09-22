import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BookmarkIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { usePreferences } from "../../contexts/PreferencesContext";

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </header>
  );
}
export function Loading({ text = "Loading the latest data" }) {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      {text}
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="notice error" role="alert">
      <ExclamationCircleIcon />
      <div>
        <strong>We couldn’t load this just now</strong>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({ title = "Nothing here yet", children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">
        <CalendarDaysIcon />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function ResourceState({ resource, children }) {
  if (resource.loading && !resource.data) return <Loading />;
  return (
    <>
      {resource.error && (
        <ErrorState message={resource.error} retry={resource.reload} />
      )}
      {(!resource.error || resource.data) && children}
    </>
  );
}

export function AuthGate({
  children,
  title = "Make it personal",
  description = "Sign in to save your training and follow your progress.",
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  return loading ? (
    <Loading text="Restoring your session" />
  ) : user ? (
    children
  ) : (
    <section className="panel auth-gate">
      <p className="eyebrow">Your PlayAxis</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link
        className="button primary"
        state={{ returnState: location.state }}
        to={`/auth?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`}
      >
        Sign in
      </Link>
      <Link
        className="button secondary"
        state={{ returnState: location.state }}
        to={`/auth?mode=register&next=${encodeURIComponent(location.pathname + location.search + location.hash)}`}
      >
        Create an account
      </Link>
    </section>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  ...props
}) {
  return (
    <div className="search-field">
      <MagnifyingGlassIcon />
      <input
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
export function formatDate(value, options = {}) {
  const dateOnly =
    typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : value
      ? new Date(value)
      : null;
  return !d || Number.isNaN(d.getTime())
    ? "Date to be confirmed"
    : d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        ...options,
      });
}
export function formatTime(value) {
  const d = value ? new Date(value) : null;
  return !d || Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
export function safeURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function SourceNote({ data }) {
  return (
    <p className="source-note">
      {data?.source && <>Data from {data.source}. </>}
      {data?.coverage}
      {data?.updated_at && <> Loaded {formatTime(data.updated_at)}.</>}
    </p>
  );
}
export function SaveButton({ event, compact = false }) {
  const { saved, toggleSaved } = usePreferences();
  const selected = saved.some((e) => e.id === event.id);
  return (
    <button
      className={`${compact ? "icon-button" : "button secondary"} ${selected ? "is-saved" : ""}`}
      aria-label={selected ? `Unsave ${event.name}` : `Save ${event.name}`}
      aria-pressed={selected}
      onClick={() => toggleSaved(event)}
    >
      <BookmarkIcon />
      {!compact && (selected ? "Saved" : "Save event")}
    </button>
  );
}
export function EventCard({ event }) {
  const d = event.start ? new Date(event.start) : null;
  const valid = d && !Number.isNaN(d.getTime());
  return (
    <article
      className={`event-card ${safeURL(event.image) ? "has-image" : ""}`}
    >
      {safeURL(event.image) && (
        <img
          className="event-image"
          src={safeURL(event.image)}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div className="event-date">
        <span>
          {valid ? d.toLocaleDateString(undefined, { month: "short" }) : "Date"}
        </span>
        <strong>{valid ? d.getDate() : "TBC"}</strong>
      </div>
      <div className="event-card-content">
        <div className="event-category">
          {event.league || event.sport || "Sport"}
        </div>
        <Link to={`/events/${encodeURIComponent(event.id)}`} state={{ event }}>
          <h3>{event.name || event.title}</h3>
        </Link>
        <p>
          <MapPinIcon />
          {event.venue || event.city || "Venue to be confirmed"}
        </p>
        <span className="muted small">
          {event.start
            ? formatTime(event.start)
            : event.date_text || "Time to be confirmed"}
        </span>
      </div>
      <SaveButton event={event} compact />
    </article>
  );
}
export function Metric({ label, value, unit, caption }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <div>
        <strong>{value}</strong>
        {unit && <small>{unit}</small>}
      </div>
      {caption && <p>{caption}</p>}
    </div>
  );
}
export function downloadFile(name, content, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
