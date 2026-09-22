import React from "react";
import FeatureArtwork from "../components/ui/FeatureArtwork";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import {
  getEvents,
  getWorkouts,
  getGoals,
  getSessions,
  getProfile,
  getRecommendations,
  getWatch,
} from "../api";
import useResource from "../hooks/useResource";
import {
  ResourceState,
  EventCard,
  Metric,
  EmptyState,
  safeURL,
} from "../components/ui";
import WeatherWidget from "../components/widgets/WeatherWidget";
import { totalWorkouts, inPeriod, distanceDisplay } from "../utils/workouts";
import { goalAmount, goalUnit } from "./GoalsPage";
import { SessionCard } from "./LocalEventsPage";
export default function HomePage() {
  const { user } = useAuth();
  const { preferences, followedTeams } = usePreferences();
  const city = preferences.location;
  const events = useResource("home-events", () => getEvents());
  const gaming = useResource("home-gaming", () => getWatch("esports"));
  const workouts = useResource(
    user ? `workouts:${user.id}` : null,
    getWorkouts,
  );
  const goals = useResource(user ? `home-goals:${user.id}` : null, getGoals);
  const profile = useResource(user ? `interests:${user.id}` : null, getProfile);
  const sessions = useResource(`home-sessions:${city.name}`, () =>
    getSessions(city.name === "Your location" ? "" : city.name),
  );
  const recommendations = useResource(
    user ? `recommendations:${user.id}` : null,
    getRecommendations,
  );
  const totals = totalWorkouts(inPeriod(workouts.data?.workouts || [], 7));
  const interests =
    profile.data?.interests?.map((i) => i.name.toLowerCase()) || [];
  const seen = new Set();
  const choices = [];
  const ranked = [...(events.data?.events || [])].sort(
    (a, b) =>
      Number(interests.some((i) => (b.sport || "").toLowerCase().includes(i))) -
      Number(interests.some((i) => (a.sport || "").toLowerCase().includes(i))),
  );
  for (const e of ranked) {
    if (!seen.has(e.league)) {
      choices.push(e);
      seen.add(e.league);
    }
  }
  return (
    <>
      <div className="field-intro">
        <div>
          <p className="field-date">TODAY{user ? ` / ${user.username}` : ""}</p>
          <h1>What’s your next move?</h1>
        </div>
        <Link className="button secondary" to="/saved">
          Your saved plans
        </Link>
      </div>
      <nav className="audience-board" aria-label="Find your starting point">
        <section className="audience-entry audience-activity">
          <Link className="audience-main" to="/log-workout">
            <FeatureArtwork kind="activity" />
            <span className="eyebrow">ATHLETICS</span>
            <h2>Get active.</h2>
            <span className="entry-action">Log activity</span>
          </Link>
          <div className="entry-links">
            <Link to="/goals">Your goals</Link>
            <Link to="/mystats">Activity journal</Link>
          </div>
        </section>
        <section className="audience-entry audience-gaming">
          <Link className="audience-main" to="/watch?category=esports">
            <FeatureArtwork kind="gaming" />
            <span className="eyebrow">GAMING</span>
            <h2>Find your game.</h2>
            <span className="entry-action">Watch gaming</span>
          </Link>
          <div className="entry-links">
            <Link to="/watch?category=chess">Live chess</Link>
            <Link to="/clubs?activity=gaming">Gaming groups</Link>
          </div>
        </section>
        <section className="audience-entry audience-events">
          <Link className="audience-main" to="/local">
            <FeatureArtwork kind="events" />
            <span className="eyebrow">EVENTS</span>
            <h2>Go somewhere.</h2>
            <span className="entry-action">Find events</span>
          </Link>
          <div className="entry-links">
            <Link to="/map">Explore the map</Link>
            <Link to="/saved">Saved plans</Link>
          </div>
        </section>
      </nav>
      <>
        {recommendations.data?.recommendations?.length > 0 && (
          <section
            className="recommendation-strip"
            aria-label="Suggested next steps"
          >
            {recommendations.data.recommendations.slice(0, 3).map((r) => (
              <Link key={r.path} to={r.path}>
                <strong>{r.title}</strong>
                <span>{r.reason}</span>
              </Link>
            ))}
          </section>
        )}
      </>
      <div className="daily-grid">
        <div className="daily-main">
          {user && (
            <section>
              <div className="section-title">
                <div>
                  <h2>This week</h2>
                </div>
                <Link className="text-link" to="/mystats">
                  View activity
                </Link>
              </div>
              {user && workouts.error ? (
                <ResourceState resource={workouts} />
              ) : (
                <div className="metrics-grid">
                  <Metric
                    label="Activities"
                    value={user && workouts.loading ? "…" : totals.count}
                    caption="Last 7 days"
                  />
                  <Metric
                    label="Distance"
                    value={
                      user && workouts.loading
                        ? "…"
                        : distanceDisplay(totals.distance, preferences.units)
                    }
                    unit={preferences.units === "imperial" ? "mi" : "km"}
                  />
                  <Metric
                    label="Time spent"
                    value={
                      user && workouts.loading
                        ? "…"
                        : Math.round(totals.minutes)
                    }
                    unit="min"
                  />
                </div>
              )}
            </section>
          )}
          <section className="panel panel-pad">
            <div className="section-title">
              <div>
                <h2>Around {city.name}</h2>
              </div>
              <Link className="text-link" to="/local">
                Find local events
              </Link>
            </div>
            <ResourceState resource={sessions}>
              {sessions.data?.events?.length ? (
                <div className="session-grid">
                  {sessions.data.events.slice(0, 2).map((event) => (
                    <SessionCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <>
                  <p className="muted">
                    No community sessions nearby yet. Make the first plan.
                  </p>
                  <div className="mini-feature-links">
                    <Link to="/local">Find events</Link>
                    <Link to="/map">Explore nearby places</Link>
                    <Link to="/sessions/new">Organise a session</Link>
                  </div>
                </>
              )}
            </ResourceState>
          </section>
          <section className="panel panel-pad">
            <div className="section-title">
              <div>
                <h2>
                  {interests.length ? "For your interests" : "Next fixtures"}
                </h2>
              </div>
              <Link className="text-link" to="/events">
                Full calendar
              </Link>
            </div>
            <ResourceState resource={events}>
              {choices.length ? (
                choices
                  .slice(0, 3)
                  .map((event) => <EventCard key={event.id} event={event} />)
              ) : (
                <EmptyState title="The next fixture is on its way.">
                  Try the match centre for recent results.
                </EmptyState>
              )}
            </ResourceState>
            {interests.length > 0 && (
              <p className="source-note">
                Your selected interests are used to order these picks.
              </p>
            )}
          </section>
          <section className="panel panel-pad">
            <div className="section-title">
              <div>
                <h2>Live gaming</h2>
              </div>
              <Link className="text-link" to="/watch?category=esports">
                View all
              </Link>
            </div>
            <ResourceState resource={gaming}>
              {gaming.data?.data?.length ? (
                <div className="live-programme">
                  {gaming.data.data.slice(0, 3).map((stream) => (
                    <Link
                      key={stream.id}
                      to={`/watch?category=${stream.game_name === "VALORANT" ? "valorant" : stream.game_name === "League of Legends" ? "league-of-legends" : "counter-strike"}`}
                    >
                      {safeURL(stream.thumbnail_url) && (
                        <img
                          className="live-thumbnail"
                          src={safeURL(stream.thumbnail_url)}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="small muted">{stream.game_name}</span>
                      <h3 title={stream.title}>{stream.title}</h3>
                      <p>
                        {stream.user_name} ·{" "}
                        {stream.viewer_count.toLocaleString()} watching
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="The next live session is on its way.">
                  Explore live chess or browse gaming categories.
                </EmptyState>
              )}
            </ResourceState>
          </section>
          {followedTeams.length > 0 && (
            <section className="panel panel-pad">
              <div className="section-title">
                <h2>Your teams.</h2>
                <Link className="text-link" to="/matches">
                  Match centre
                </Link>
              </div>
              <div className="followed-teams">
                {followedTeams.map((t) => (
                  <Link
                    key={t.idTeam}
                    className="followed-team"
                    to={`/matches?team=${t.idTeam}`}
                  >
                    <strong>{t.strTeam}</strong>
                    <p>{t.strLeague}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="daily-aside">
          <WeatherWidget />
          {user && (
            <section className="panel panel-pad">
              <h2>Your goals</h2>
              {goals.data?.goals?.slice(0, 2).map((g) => (
                <div key={g.id} style={{ marginTop: 22 }}>
                  <h3>{g.title}</h3>
                  <div className="goal-progress">
                    <span style={{ width: `${g.percent}%` }} />
                  </div>
                  <p className="small muted">
                    {goalAmount(g.progress, g.metric, preferences.units)} /{" "}
                    {goalAmount(g.target, g.metric, preferences.units)}{" "}
                    {goalUnit(g.metric, preferences.units)}
                  </p>
                </div>
              ))}
              {!goals.data?.goals?.length && (
                <p className="muted small" style={{ marginTop: 12 }}>
                  Choose a weekly or monthly target.
                </p>
              )}
              <Link
                className="text-link"
                style={{ display: "inline-block", marginTop: 22 }}
                to="/goals"
              >
                {goals.data?.goals?.length
                  ? "View all goals"
                  : "Set your first goal"}
              </Link>
            </section>
          )}
          <section className="photo-note panel">
            <img
              src="/images/track-runner.jpg"
              alt="Runner on an outdoor track"
              loading="lazy"
            />
            <div className="photo-caption">
              <strong>There’s a place for your pace.</strong>
              <div>
                <Link
                  className="small"
                  style={{ textDecoration: "underline" }}
                  to="/clubs"
                >
                  Find your people
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
