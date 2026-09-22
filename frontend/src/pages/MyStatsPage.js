import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ActivityTimer from "../components/ActivityTimer";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { getWorkouts, deleteWorkout } from "../api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  AuthGate,
  ResourceState,
  EmptyState,
  Metric,
  formatDate,
  downloadFile,
} from "../components/ui";
import {
  totalWorkouts,
  inPeriod,
  distanceDisplay,
  pace,
} from "../utils/workouts";
function Stats() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const location = useLocation();
  const [days, setDays] = useState(7);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const resource = useResource(`workouts:${user.id}`, getWorkouts);
  const all = resource.data?.workouts || [];
  const workouts = inPeriod(all, days);
  const totals = totalWorkouts(workouts);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const minutes = all
      .filter(
        (w) => new Date(w.started_at).toDateString() === date.toDateString(),
      )
      .reduce((v, w) => v + w.duration_sec / 60, 0);
    return { date, minutes };
  });
  const max = Math.max(30, ...week.map((d) => d.minutes));
  async function remove(id) {
    setError("");
    try {
      await deleteWorkout(id);
      setDeleting(null);
      resource.reload();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <ResourceState resource={resource}>
      {location.state?.saved && (
        <p role="status" className="notice success">
          Activity saved. Your training log is up to date.
        </p>
      )}
      <div className="toolbar">
        <div className="segmented" style={{ margin: 0 }}>
          {[
            [7, "Last 7 days"],
            [30, "Last 30 days"],
            [0, "All time"],
          ].map(([d, label]) => (
            <button
              key={d}
              className={days === d ? "active" : ""}
              aria-pressed={days === d}
              onClick={() => setDays(d)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="button secondary"
          style={{ marginLeft: "auto" }}
          disabled={!all.length}
          onClick={() =>
            downloadFile(
              "playaxis-activities.json",
              JSON.stringify(all, null, 2),
            )
          }
        >
          Export activities
        </button>
      </div>
      <div className="page-stack">
        <ActivityTimer />
        <div className="metrics-grid">
          <Metric
            label="Activities"
            value={totals.count}
            caption="Recorded by you"
          />
          <Metric
            label="Distance"
            value={distanceDisplay(totals.distance, preferences.units)}
            unit={preferences.units === "imperial" ? "mi" : "km"}
            caption="Across your activities"
          />
          <Metric
            label="Time spent"
            value={Math.round(totals.minutes)}
            unit="min"
            caption="Every minute counts"
          />
        </div>
        <section className="panel panel-pad">
          <div className="section-title">
            <h2>Your last seven days</h2>
            <span className="small muted">Minutes moving</span>
          </div>
          <div
            className="chart-bars"
            role="img"
            aria-label={week
              .map(
                (d) =>
                  `${d.date.toLocaleDateString(undefined, { weekday: "long" })}: ${Math.round(d.minutes)} minutes`,
              )
              .join(", ")}
          >
            {week.map((d) => (
              <div className="chart-column" key={d.date.toISOString()}>
                <span>{Math.round(d.minutes)}</span>
                <div style={{ height: `${(d.minutes / max) * 100}%` }} />
                <small>
                  {d.date.toLocaleDateString(undefined, { weekday: "short" })}
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-pad">
            <h2>Your training log</h2>
          </div>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          {workouts.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Distance</th>
                    <th>Pace</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <p className="activity-title">{w.sport}</p>
                        {w.notes && (
                          <p
                            className="muted small"
                            style={{
                              fontWeight: 400,
                              maxWidth: 260,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {w.notes}
                          </p>
                        )}
                      </td>
                      <td>{formatDate(w.started_at, { year: "numeric" })}</td>
                      <td>{Math.round(w.duration_sec / 60)} min</td>
                      <td>
                        {w.distance_m == null
                          ? "Not recorded"
                          : `${distanceDisplay(w.distance_m / 1000, preferences.units)} ${preferences.units === "imperial" ? "mi" : "km"}`}
                      </td>
                      <td>{pace(w, preferences.units)}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="text-link"
                            to={`/log-workout?edit=${w.id}`}
                          >
                            Edit
                          </Link>
                          {deleting === w.id ? (
                            <>
                              <button
                                className="text-button danger"
                                onClick={() => remove(w.id)}
                              >
                                Confirm delete
                              </button>
                              <button
                                className="text-button"
                                onClick={() => setDeleting(null)}
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              className="text-button danger"
                              onClick={() => setDeleting(w.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Make your first mark"
              action={
                <Link className="button primary" to="/log-workout">
                  Log an activity
                </Link>
              }
            >
              Your activities will appear here. A walk, a ride or a quick
              practice session is a good place to start.
            </EmptyState>
          )}
        </section>
      </div>
    </ResourceState>
  );
}
export default function MyStatsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Progress, at your pace"
        title="My activity"
        description="A little perspective on the effort you’re putting in."
      >
        <Link to="/log-workout" className="button primary">
          <PlusIcon />
          Log activity
        </Link>
      </PageHeader>
      <AuthGate>
        <Stats />
      </AuthGate>
    </>
  );
}
