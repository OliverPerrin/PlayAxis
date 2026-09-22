import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { saveWorkout, getWorkout, updateWorkout } from "../api";
import { PageHeader, AuthGate, ResourceState } from "../components/ui";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import { ACTIVITIES, localDateTime } from "../utils/workouts";
function WorkoutForm() {
  const { preferences } = usePreferences();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const requestedSeconds = Number(params.get("duration"));
  const timedSeconds =
    Number.isFinite(requestedSeconds) &&
    requestedSeconds > 0 &&
    requestedSeconds <= 604800
      ? requestedSeconds
      : 0;
  const timerStart = params.get("started")
    ? new Date(params.get("started"))
    : timedSeconds
      ? new Date(Date.now() - timedSeconds * 1000)
      : null;
  const validTimerStart =
    timerStart &&
    Number.isFinite(timerStart.getTime()) &&
    timerStart <= new Date()
      ? timerStart
      : null;
  const existing = useResource(editId ? `edit-workout:${editId}` : null, () =>
    getWorkout(editId),
  );
  const record = existing.data;
  const changed = useRef(new Set());
  useEffect(() => {
    changed.current.clear();
  }, [record?.id]);
  const imperial = preferences.units === "imperial";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const duration = Number(form.get("duration"));
    const distance = form.get("distance");
    const started = new Date(form.get("started"));
    if (!Number.isFinite(duration) || duration <= 0 || started > new Date()) {
      setError("Enter a positive duration and a start time in the past.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        sport: form.get("sport"),
        started_at:
          record && !changed.current.has("started")
            ? record.started_at
            : validTimerStart && !changed.current.has("started")
              ? validTimerStart.toISOString()
              : started.toISOString(),
        duration_sec:
          record && !changed.current.has("duration")
            ? record.duration_sec
            : Math.round(duration * 60),
        distance_m:
          record && !changed.current.has("distance")
            ? record.distance_m
            : distance === ""
              ? null
              : Number(distance) * (imperial ? 1609.344 : 1000),
        notes: form.get("notes") || null,
        units:
          record && !changed.current.has("distance")
            ? record.units
            : { ...record?.units, system: preferences.units },
      };
      if (editId) await updateWorkout(editId, payload);
      else await saveWorkout(payload);
      if (timedSeconds && !editId)
        localStorage.removeItem("playaxis.activityTimer");
      navigate("/mystats", { state: { saved: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (editId && (existing.loading || existing.error))
    return <ResourceState resource={existing} />;
  return (
    <div className="activity-form-layout">
      <form
        className="panel panel-pad"
        onSubmit={submit}
        key={record?.id || "new"}
        onChange={(e) => {
          if (e.target.name) changed.current.add(e.target.name);
        }}
      >
        <div className="section-title">
          <h2>Activity details</h2>
        </div>
        <div className="form-grid">
          <label>
            Activity
            <select name="sport" defaultValue={record?.sport || "running"}>
              {ACTIVITIES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            When did you start?
            <input
              name="started"
              type="datetime-local"
              required
              defaultValue={
                record
                  ? localDateTime(new Date(record.started_at))
                  : validTimerStart
                    ? localDateTime(validTimerStart)
                    : localDateTime()
              }
              max={localDateTime()}
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              name="duration"
              min="0.01"
              max="10080"
              step="any"
              placeholder="30"
              defaultValue={
                record
                  ? record.duration_sec / 60
                  : timedSeconds
                    ? timedSeconds / 60
                    : undefined
              }
              required
            />
          </label>
          <label>
            Distance ({imperial ? "miles" : "km"})
            <input
              name="distance"
              type="number"
              min="0"
              max={imperial ? "6213" : "10000"}
              step="0.01"
              placeholder="Optional"
              defaultValue={
                record?.distance_m != null
                  ? Number(
                      (
                        record.distance_m / (imperial ? 1609.344 : 1000)
                      ).toFixed(2),
                    )
                  : undefined
              }
            />
          </label>
          <label className="full">
            How did it go?
            <textarea
              name="notes"
              maxLength={2000}
              defaultValue={record?.notes || ""}
              rows={4}
              placeholder="A good route, a new personal best, or simply getting it done."
            />
          </label>
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button primary" disabled={busy}>
            {busy
              ? "Saving activity…"
              : editId
                ? "Save changes"
                : "Save activity"}
          </button>
          <span className="small muted">Private to you</span>
          <Link className="button secondary" to="/mystats">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
export default function LogWorkoutPage() {
  const [params] = useSearchParams();
  return (
    <>
      <PageHeader
        eyebrow="Keep the momentum"
        title={params.get("edit") ? "Edit your activity" : "Log an activity"}
      />
      <AuthGate title="Your training deserves a home">
        <WorkoutForm />
      </AuthGate>
    </>
  );
}
