import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getSportsEvents, searchTeams, teamUpcomingEvents } from "../api";
import useResource from "../hooks/useResource";
import { usePreferences } from "../contexts/PreferencesContext";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  SourceNote,
  formatDate,
  formatTime,
  safeURL,
  SearchField,
} from "../components/ui";
import { LEAGUES } from "../utils/sports";
function Match({ match }) {
  return (
    <article className="match-card">
      <div className="match-meta">
        <Link
          className="text-link"
          to={`/events/${match.id}`}
          state={{ event: match }}
        >
          {formatDate(match.start)} · {formatTime(match.start)}
        </Link>
        <span>
          {match.status || (match.completed ? "Finished" : "Scheduled")}
        </span>
      </div>
      {match.home_team ? (
        <div className="match-teams">
          <div className="team-name">
            {safeURL(match.home_badge) && (
              <img
                src={safeURL(match.home_badge)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            {match.home_team}
          </div>
          <div className="match-score">
            {match.home_score != null && match.away_score != null
              ? `${match.home_score} : ${match.away_score}`
              : "vs"}
          </div>
          <div className="team-name">
            {match.away_team}
            {safeURL(match.away_badge) && (
              <img
                src={safeURL(match.away_badge)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <h3>{match.name}</h3>
      )}
      <p className="source-note" style={{ marginTop: 13 }}>
        {match.venue || match.league || "Venue to be confirmed"}
      </p>
    </article>
  );
}
export default function MatchesPage() {
  const { followedTeams, toggleTeam } = usePreferences();
  const [params, setParams] = useSearchParams();
  const sport = params.get("sport") || "bundesliga";
  const teamId = params.get("team");
  const [period, setPeriod] = useState("all");
  const [teamQuery, setTeamQuery] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(20);
  const resource = useResource(!teamId ? `matches:${sport}` : null, () =>
    getSportsEvents(sport),
  );
  const search = useResource(query ? `teams:${query}` : null, () =>
    searchTeams(query),
  );
  const teamEvents = useResource(teamId ? `team:${teamId}` : null, () =>
    teamUpcomingEvents(teamId),
  );
  const team =
    teamEvents.data?.team ||
    followedTeams.find((t) => String(t.idTeam) === teamId);
  const focusedLeague = {
    4328: "epl",
    4331: "bundesliga",
    4387: "nba",
    4391: "nfl",
    4380: "nhl",
    4424: "mlb",
  }[team?.idLeague];
  const activeLeague = teamId ? focusedLeague : sport;
  const upcoming = resource.data?.upcoming || [];
  const recent = resource.data?.recent || [];
  const items =
    period === "upcoming"
      ? upcoming
      : period === "recent"
        ? recent
        : [...upcoming, ...recent];
  useEffect(() => setVisible(20), [sport, period, teamId]);
  return (
    <>
      <PageHeader
        eyebrow="02 / FOLLOW"
        title="Match centre"
        description="Your leagues, your teams, and the next reason to care about the score."
      >
        <select
          aria-label="Choose league"
          value={activeLeague || ""}
          onChange={(e) => {
            setParams({ sport: e.target.value });
            setPeriod("all");
          }}
        >
          <option value="" disabled>
            Choose a league
          </option>
          {LEAGUES.map((l) => (
            <option key={l.key} value={l.key}>
              {l.name}
            </option>
          ))}
        </select>
      </PageHeader>
      <div className="inline-links">
        {activeLeague && (
          <>
            <Link to={`/leaderboards?sport=${activeLeague}`}>
              Standings & records
            </Link>
            <Link to={`/events?sport=${activeLeague}`}>Calendar view</Link>
          </>
        )}
        <Link to="/watch">Watch live</Link>
      </div>
      <section className="panel panel-pad" style={{ marginBottom: 25 }}>
        <div className="section-title">
          <h2>Keep your team close.</h2>
          {teamId && (
            <Link
              className="text-link"
              to={`/matches?sport=${activeLeague || sport}`}
            >
              Back to league fixtures
            </Link>
          )}
        </div>
        <form
          className="toolbar"
          style={{ marginBottom: 0 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (query === teamQuery.trim()) search.reload();
            else setQuery(teamQuery.trim());
          }}
        >
          <SearchField
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            placeholder="Team name, for example Arsenal"
            label="Search team"
            required
            minLength={2}
          />
          <button className="button secondary">Find team</button>
        </form>
        {query && (
          <ResourceState resource={search}>
            {search.data?.teams?.length ? (
              <ul className="city-results">
                {search.data.teams.map((t) => (
                  <li key={t.idTeam}>
                    <button
                      onClick={() => {
                        setParams({ sport, team: t.idTeam });
                        setQuery("");
                        setTeamQuery("");
                      }}
                    >
                      {t.strTeam}
                      <span>{t.strLeague}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="source-note">No team found. Try the full name.</p>
            )}
          </ResourceState>
        )}
        {followedTeams.length > 0 && (
          <>
            <div className="followed-teams" style={{ marginTop: 20 }}>
              {followedTeams.map((t) => (
                <button
                  className="followed-team"
                  style={{
                    textAlign: "left",
                    borderColor:
                      teamId === t.idTeam ? "var(--accent)" : undefined,
                  }}
                  key={t.idTeam}
                  onClick={() => setParams({ sport, team: t.idTeam })}
                >
                  <strong>{t.strTeam}</strong>
                  <p>{t.strLeague}</p>
                </button>
              ))}
            </div>
            <p className="source-note">
              Followed teams are saved on this device.
            </p>
          </>
        )}
      </section>
      {teamId ? (
        <ResourceState resource={teamEvents}>
          <section className="panel">
            <div
              className="panel-pad section-title"
              style={{ marginBottom: 0 }}
            >
              <div>
                <p className="eyebrow">UPCOMING FIXTURES</p>
                <h2>{team?.strTeam || "Selected team"}</h2>
              </div>
              {team && (
                <button
                  className="follow-button"
                  aria-pressed={followedTeams.some(
                    (t) => t.idTeam === team.idTeam,
                  )}
                  onClick={() => toggleTeam(team)}
                >
                  {followedTeams.some((t) => t.idTeam === team.idTeam)
                    ? "Following team"
                    : "Follow this team"}
                </button>
              )}
            </div>
            {teamEvents.data?.upcoming?.length ? (
              teamEvents.data.upcoming.map((m) => (
                <Match key={m.id} match={m} />
              ))
            ) : (
              <EmptyState title="No upcoming fixture is available yet.">
                Follow this team and check back when its schedule is published.
              </EmptyState>
            )}
            <div className="panel-pad" style={{ paddingTop: 0 }}>
              <SourceNote data={teamEvents.data} />
            </div>
          </section>
        </ResourceState>
      ) : (
        <>
          <div className="segmented">
            {[
              ["all", "All fixtures"],
              ["upcoming", "Upcoming"],
              ["recent", "Recent results"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={period === key ? "active" : ""}
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <ResourceState resource={resource}>
            {items.length ? (
              <section className="panel">
                {items.slice(0, visible).map((m) => (
                  <Match key={m.id} match={m} />
                ))}
                {items.length > visible && (
                  <div className="panel-pad">
                    <button
                      className="button secondary"
                      onClick={() => setVisible((v) => v + 20)}
                    >
                      Show more fixtures ({items.length - visible} remaining)
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <section className="panel">
                <EmptyState title="No fixtures in this view">
                  Try recent results or another league.
                </EmptyState>
              </section>
            )}
          </ResourceState>
          <SourceNote data={resource.data} />
        </>
      )}
    </>
  );
}
