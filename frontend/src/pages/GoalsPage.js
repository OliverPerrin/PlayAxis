import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { getGoals, createTrainingGoal, deleteTrainingGoal } from "../api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  AuthGate,
  ResourceState,
  EmptyState,
} from "../components/ui";
import { ACTIVITIES } from "../utils/workouts";
export function goalAmount(value, metric, units = "metric") {
  return metric === "distance_m"
    ? (value / (units === "imperial" ? 1609.344 : 1000)).toLocaleString(
        undefined,
        { maximumFractionDigits: 1 },
      )
    : metric === "duration_sec"
      ? Math.round(value / 60)
      : value;
}
export function goalUnit(metric, units) {
  return metric === "distance_m"
    ? units === "imperial"
      ? "miles"
      : "km"
    : metric === "duration_sec"
      ? "minutes"
      : "sessions";
}
function Goals() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const resource = useResource(`goals:${user.id}`, getGoals);
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState("sessions");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    let target = Number(form.get("target"));
    if (metric === "distance_m")
      target *= preferences.units === "imperial" ? 1609.344 : 1000;
    if (metric === "duration_sec") target *= 60;
    try {
      await createTrainingGoal({
        title: form.get("title").trim(),
        sport: form.get("sport") || null,
        period: form.get("period"),
        metric,
        target,
      });
      setAdding(false);
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    try {
      await deleteTrainingGoal(id);
      setConfirm(null);
      resource.reload();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="page-stack">
      <div className="section-title">
        <p className="muted">Small commitments. Visible progress.</p>
        <button className="button primary" onClick={() => setAdding((v) => !v)}>
          <PlusIcon />
          {adding ? "Close goal form" : "Create a goal"}
        </button>
      </div>
      {adding && (
        <div className="detail-layout">
          <form className="panel panel-pad" onSubmit={create}>
            <h2>Give your effort a direction.</h2>
            <div className="form-grid" style={{ marginTop: 22 }}>
              <label className="full">
                Goal name
                <input
                  name="title"
                  placeholder="Make time for three runs"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label>
                What counts?
                <select name="sport">
                  <option value="">All activities</option>
                  {ACTIVITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Repeat each
                <select name="period">
                  <option value="weekly">Week</option>
                  <option value="monthly">Month</option>
                </select>
              </label>
              <label>
                Measure
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                >
                  <option value="sessions">Number of sessions</option>
                  <option value="distance_m">Distance</option>
                  <option value="duration_sec">Time moving</option>
                </select>
              </label>
              <label>
                Target ({goalUnit(metric, preferences.units)})
                <input
                  name="target"
                  type="number"
                  min={metric === "sessions" ? 1 : 0.1}
                  step={metric === "sessions" ? 1 : 0.1}
                  required
                  placeholder={metric === "sessions" ? "3" : "30"}
                />
              </label>
            </div>
            <button
              className="button primary"
              style={{ marginTop: 22 }}
              disabled={busy}
            >
              {busy ? "Saving…" : "Set my goal"}
            </button>
          </form>
          <aside className="form-explainer">
            <h2>Your effort counts.</h2>
            <p>
              Progress updates from the activities in your training log. Weekly
              goals start on Monday in your browser’s timezone. Monthly goals
              start on the first of the month.
            </p>
            <p>
              You choose the target. You can change direction whenever you need
              to.
            </p>
          </aside>
        </div>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <ResourceState resource={resource}>
        {resource.data?.goals?.length ? (
          <div className="goal-grid">
            {resource.data.goals.map((g) => (
              <article className="panel goal-card" key={g.id}>
                <header>
                  <p className="eyebrow">
                    {g.period} · {g.sport || "All activities"}
                  </p>
                  {confirm === g.id ? (
                    <div>
                      <button
                        className="text-button danger"
                        onClick={() => remove(g.id)}
                      >
                        Remove goal
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setConfirm(null)}
                        style={{ marginLeft: 10 }}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => setConfirm(g.id)}
                    >
                      Manage
                    </button>
                  )}
                </header>
                <h2>{g.title}</h2>
                <div className="goal-number">
                  {goalAmount(g.progress, g.metric, preferences.units)}
                  <small>
                    / {goalAmount(g.target, g.metric, preferences.units)}{" "}
                    {goalUnit(g.metric, preferences.units)}
                  </small>
                </div>
                <div
                  className="goal-progress"
                  role="progressbar"
                  aria-label={g.title}
                  aria-valuenow={Math.round(g.percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${g.percent}%` }} />
                </div>
                <p className="small muted">
                  {g.percent >= 100
                    ? "Goal reached. Keep the momentum."
                    : `${Math.round(g.percent)}% of the way there.`}
                </p>
                <Link
                  className="text-link"
                  style={{ display: "inline-block", marginTop: 18 }}
                  to="/log-workout"
                >
                  Log an activity
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <section className="panel">
            <EmptyState
              title="Start with something you can show up for."
              action={
                <button
                  className="button primary"
                  onClick={() => setAdding(true)}
                >
                  Set your first goal
                </button>
              }
            >
              Three sessions a week, a little more walking, or an hour in the
              pool. Make it yours.
            </EmptyState>
          </section>
        )}
      </ResourceState>
    </div>
  );
}
export default function GoalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="03 / TRAIN"
        title="A goal of your own."
        description="Give your week a little direction, then let your recorded activities tell the story."
      />
      <AuthGate title="Your goals. Your pace.">
        <Goals />
      </AuthGate>
    </>
  );
}
