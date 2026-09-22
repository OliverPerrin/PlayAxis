import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import { getWorkouts, searchAthletes, compareAthlete } from "../api";
import {
  PageHeader,
  AuthGate,
  ResourceState,
  EmptyState,
  formatDate,
} from "../components/ui";
import { distanceDisplay, pace } from "../utils/workouts";
function PersonalCompare() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const resource = useResource(`compare:${user.id}`, getWorkouts);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const items = resource.data?.workouts || [];
  const a = items.find((w) => String(w.id) === left);
  const b = items.find((w) => String(w.id) === right);
  return (
    <ResourceState resource={resource}>
      {items.length < 2 ? (
        <section className="panel">
          <EmptyState
            title="Two activities tell a story"
            action={
              <Link className="button primary" to="/log-workout">
                Log an activity
              </Link>
            }
          >
            Record at least two sessions, then compare distance, duration and
            pace.
          </EmptyState>
        </section>
      ) : (
        <div className="page-stack">
          <div className="two-columns">
            {[
              [left, setLeft, "First activity"],
              [right, setRight, "Second activity"],
            ].map(([value, set, label]) => (
              <section className="panel panel-pad" key={label}>
                <label>
                  {label}
                  <select value={value} onChange={(e) => set(e.target.value)}>
                    <option value="">Choose a session</option>
                    {items.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.sport} · {formatDate(w.started_at)} ·{" "}
                        {Math.round(w.duration_sec / 60)} min
                      </option>
                    ))}
                  </select>
                </label>
              </section>
            ))}
          </div>
          {a && b && (
            <section className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Measure</th>
                      <th>First activity</th>
                      <th>Second activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sport</td>
                      <td className="activity-title">{a.sport}</td>
                      <td className="activity-title">{b.sport}</td>
                    </tr>
                    <tr>
                      <td>Duration</td>
                      <td>{(a.duration_sec / 60).toFixed(1)} min</td>
                      <td>{(b.duration_sec / 60).toFixed(1)} min</td>
                    </tr>
                    <tr>
                      <td>Distance</td>
                      {[a, b].map((w, i) => (
                        <td key={i}>
                          {w.distance_m == null
                            ? "Not recorded"
                            : `${distanceDisplay(w.distance_m / 1000, preferences.units)} ${preferences.units === "imperial" ? "mi" : "km"}`}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Average pace</td>
                      <td>{pace(a, preferences.units)}</td>
                      <td>{pace(b, preferences.units)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="source-note" style={{ padding: "0 20px 20px" }}>
                {a.id === b.id
                  ? "You selected the same activity twice."
                  : a.sport !== b.sport
                    ? "These sessions are different sports. Pace is shown for reference."
                    : "Different routes, conditions and distances affect pace. Use the comparison as context for your own progress."}
              </p>
            </section>
          )}
        </div>
      )}
    </ResourceState>
  );
}
function BenchmarkCompare() {
  const { preferences } = usePreferences();
  const [sport, setSport] = useState("running");
  const resource = useResource("benchmarks:" + sport, () =>
    searchAthletes(sport),
  );
  const [selected, setSelected] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("0");
  const [distance, setDistance] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const b =
    resource.data?.athletes?.find((a) => a.id === selected) ||
    resource.data?.athletes?.[0];
  const performance = b
    ? sport === "cycling"
      ? "56.792 km in one hour"
      : `${Math.floor(b.time_sec / 60)}:${(b.time_sec % 60).toFixed(2).padStart(5, "0")}`
    : "";
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user_metrics =
        sport === "cycling"
          ? {
              distance_m:
                Number(distance) *
                (preferences.units === "imperial" ? 1609.344 : 1000),
            }
          : { time_sec: Number(minutes) * 60 + Number(seconds) };
      setResult(
        await compareAthlete({ sport, athlete_id: b.id, user_metrics }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const metric = result?.metrics?.[0];
  return (
    <div className="page-stack">
      <div className="toolbar">
        <label style={{ minWidth: 250 }}>
          Choose a sport
          <select
            value={sport}
            disabled={busy}
            onChange={(e) => {
              setSport(e.target.value);
              setSelected("");
              setResult(null);
              setError("");
            }}
          >
            <option value="running">Running · 5,000 m</option>
            <option value="cycling">Track cycling · One hour</option>
            <option value="swimming">Swimming · 400 m freestyle</option>
          </select>
        </label>
      </div>
      <ResourceState resource={resource}>
        {b && (
          <div className="two-columns">
            <form className="panel panel-pad" onSubmit={submit}>
              <h2>
                {sport === "cycling"
                  ? "Your one-hour distance"
                  : sport === "swimming"
                    ? "Your 400 m freestyle time"
                    : "Your 5 km time"}
              </h2>
              <p className="source-note" style={{ marginBottom: 22 }}>
                Compare the same distance or duration with a published
                historical performance.
              </p>
              <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
                <label>
                  Reference performance
                  <select
                    value={b.id}
                    onChange={(e) => {
                      setSelected(e.target.value);
                      setResult(null);
                    }}
                  >
                    {resource.data.athletes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.date}
                      </option>
                    ))}
                  </select>
                </label>
                {sport === "cycling" ? (
                  <label style={{ marginTop: 18 }}>
                    Distance in 60 minutes (
                    {preferences.units === "imperial" ? "miles" : "km"})
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.01"
                      required
                      value={distance}
                      onChange={(e) => {
                        setDistance(e.target.value);
                        setResult(null);
                      }}
                    />
                  </label>
                ) : (
                  <div className="form-grid" style={{ marginTop: 18 }}>
                    <label>
                      Minutes
                      <input
                        type="number"
                        min="0"
                        max="600"
                        step="1"
                        required
                        value={minutes}
                        onChange={(e) => {
                          setMinutes(e.target.value);
                          setResult(null);
                        }}
                      />
                    </label>
                    <label>
                      Seconds
                      <input
                        type="number"
                        min="0"
                        max="59.99"
                        step="0.01"
                        required
                        value={seconds}
                        onChange={(e) => {
                          setSeconds(e.target.value);
                          setResult(null);
                        }}
                      />
                    </label>
                  </div>
                )}
                <button className="button primary" style={{ marginTop: 22 }}>
                  {busy ? "Comparing…" : "Compare performance"}
                </button>
              </fieldset>
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
            </form>
            <section className="panel panel-pad">
              <p className="eyebrow">A HISTORICAL PERFORMANCE</p>
              <h2>{b.name}</h2>
              <p className="muted" style={{ marginTop: 12 }}>
                {b.venue} · {formatDate(b.date, { year: "numeric" })}
              </p>
              <div className="goal-number" style={{ marginBottom: 20 }}>
                {performance}
              </div>
              <a
                className="text-link"
                href={b.source}
                target="_blank"
                rel="noreferrer"
              >
                Read the original source
              </a>
              {metric && (
                <div
                  className="benchmark"
                  role="status"
                  style={{ marginTop: 24 }}
                >
                  <h3>
                    {sport === "cycling"
                      ? `${((metric.user_value / metric.athlete_value) * 100).toFixed(1)}% of the reference distance`
                      : `${Math.abs(metric.delta).toFixed(2)} seconds ${metric.delta >= 0 ? "longer" : "shorter"}`}
                  </h3>
                  <p className="source-note">
                    {sport === "cycling"
                      ? "Both distances cover exactly one hour."
                      : `Your entered time is ${metric.ratio.toFixed(2)} times the reference time.`}
                  </p>
                </div>
              )}
              <p className="source-note">
                These are dated race performances. Course, equipment, pool
                length and conditions affect comparisons. The result describes
                the mathematical difference between the two performances.
              </p>
            </section>
          </div>
        )}
      </ResourceState>
    </div>
  );
}
export default function ComparePage() {
  const [tab, setTab] = useState("sessions");
  return (
    <>
      <PageHeader
        eyebrow="Find your perspective"
        title="Compare your effort"
        description="Look back at your own sessions, or compare a run, swim or one-hour ride with a remarkable performance."
      />
      <div className="segmented">
        <button
          className={tab === "sessions" ? "active" : ""}
          aria-pressed={tab === "sessions"}
          onClick={() => setTab("sessions")}
        >
          Your sessions
        </button>
        <button
          className={tab === "benchmarks" ? "active" : ""}
          aria-pressed={tab === "benchmarks"}
          onClick={() => setTab("benchmarks")}
        >
          Race benchmarks
        </button>
      </div>
      {tab === "sessions" ? (
        <AuthGate>
          <PersonalCompare />
        </AuthGate>
      ) : (
        <BenchmarkCompare />
      )}
    </>
  );
}
