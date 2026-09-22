import React, { useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import { useAuth } from "../contexts/AuthContext";
import { createSession, getClub } from "../api";
import useResource from "../hooks/useResource";
import { PageHeader, AuthGate } from "../components/ui";
import LocationSearch from "../components/LocationSearch";
import EventMap from "../components/events/EventMap";
import { ACTIVITIES, localDateTime } from "../utils/workouts";
function SessionForm() {
  const { preferences } = usePreferences();
  const { user } = useAuth();
  const route = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const place = route.state?.place;
  const clubId = params.get("club");
  const club = useResource(
    clubId ? `host-club:${clubId}:${user.id}` : null,
    () => getClub(clubId),
  );
  const [city, setCity] = useState(
    place
      ? place.city || ""
      : preferences.location.name === "Your location"
        ? ""
        : preferences.location.name,
  );
  const [origin, setOrigin] = useState(
    place
      ? {
          ...preferences.location,
          latitude: place.latitude,
          longitude: place.longitude,
        }
      : preferences.location,
  );
  const [pin, setPin] = useState(
    place
      ? {
          latitude: place.latitude,
          longitude: place.longitude,
          id: "meeting-point",
          name: "Meeting point",
        }
      : null,
  );
  const [showMap, setShowMap] = useState(!!place);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const center = useMemo(() => [origin.latitude, origin.longitude], [origin]);
  const points = useMemo(() => (pin ? [pin] : []), [pin]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const result = await createSession({
        title: f.get("title").trim(),
        sport: f.get("sport"),
        description: f.get("description").trim(),
        city: city.trim(),
        venue: f.get("venue").trim(),
        starts_at: new Date(f.get("start")).toISOString(),
        club_id: clubId ? Number(clubId) : null,
        latitude: pin?.latitude ?? null,
        longitude: pin?.longitude ?? null,
      });
      navigate(`/events/${result.id}`, { state: { event: result } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="detail-layout">
      <form className="panel panel-pad" onSubmit={submit}>
        <h2>Put a good plan out there.</h2>
        {clubId && (
          <p className="source-note">
            For {club.data?.name || "your selected club"}.{" "}
            {!club.data?.joined && (
              <Link className="text-link" to={`/clubs/${clubId}`}>
                Join the group before organising.
              </Link>
            )}
          </p>
        )}
        {club.error && (
          <p className="notice error" role="alert">
            {club.error}
          </p>
        )}
        <div className="form-grid" style={{ marginTop: 25 }}>
          <label className="full">
            Session name
            <input
              name="title"
              placeholder="A relaxed Sunday morning run"
              minLength={3}
              maxLength={160}
              required
            />
          </label>
          <label>
            Activity
            <select
              name="sport"
              defaultValue={
                ACTIVITIES.includes(params.get("activity"))
                  ? params.get("activity")
                  : "running"
              }
            >
              {ACTIVITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Date and time
            <input
              type="datetime-local"
              name="start"
              min={localDateTime()}
              required
            />
          </label>
          <label>
            City or town
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            Meeting place
            <input
              name="venue"
              defaultValue={place?.name || ""}
              placeholder="The park’s north entrance"
              minLength={2}
              maxLength={180}
              required
            />
          </label>
          <label className="full">
            What should people know?
            <textarea
              name="description"
              rows={4}
              minLength={10}
              maxLength={3000}
              placeholder="The pace, distance, who it suits, and anything to bring."
              required
            />
          </label>
        </div>
        <button
          type="button"
          className="text-button"
          style={{ marginTop: 12 }}
          onClick={() => setShowMap((v) => !v)}
        >
          {showMap ? "Hide location picker" : "Add a meeting point on the map"}
        </button>
        {showMap && (
          <section style={{ marginTop: 20 }}>
            <LocationSearch
              embedded
              onSelect={(location) => {
                setOrigin(location);
                setCity(location.name);
                setPin(null);
              }}
            />
            <p className="source-note" style={{ marginBottom: 15 }}>
              Click the exact meeting point on the map. A searched city alone
              does not set the meeting point.
            </p>
            <div className="panel" style={{ height: 340 }}>
              <EventMap
                center={center}
                points={points}
                onPointPick={(point) =>
                  setPin({
                    ...point,
                    id: "meeting-point",
                    name: "Meeting point",
                  })
                }
              />
            </div>
            {pin && (
              <div className="form-actions">
                <p className="small">Meeting point added.</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setPin(null)}
                >
                  Remove pin
                </button>
              </div>
            )}
          </section>
        )}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button primary"
            disabled={busy || (clubId && !club.data?.joined)}
          >
            {busy ? "Publishing session…" : "Publish session"}
          </button>
          <Link to="/local" className="button secondary">
            Cancel
          </Link>
        </div>
        <p className="source-note">
          The session, meeting point and your display name will be public.
          Choose a public venue and avoid sharing personal contact details.
        </p>
      </form>
      <aside className="form-explainer">
        <p className="eyebrow" style={{ color: "var(--muted)" }}>
          A SMALL INVITATION
        </p>
        <h2>You don’t have to be an expert.</h2>
        <p>
          A clear meeting place, a realistic pace and a friendly description are
          a good start.
        </p>
        <p>
          People can RSVP on your session page. You can cancel a session from
          that page if plans change.
        </p>
        <p>
          Check the venue’s access and booking requirements before organising.
        </p>
      </aside>
    </div>
  );
}
export default function CreateSessionPage() {
  return (
    <>
      <PageHeader
        eyebrow="01 / PLAY"
        title="Make the first move."
        description="A run, a ride, a game or a good excuse to get outside together."
      />
      <AuthGate title="Bring people together.">
        <SessionForm />
      </AuthGate>
    </>
  );
}
