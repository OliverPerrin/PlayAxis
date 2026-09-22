import React, { useState } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import {
  getClubs,
  createClub,
  getClub,
  toggleClubMembership,
  deleteClub,
} from "../api";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  SearchField,
  EventCard,
} from "../components/ui";
import { ACTIVITIES } from "../utils/workouts";
export function ClubDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const resource = useResource(`club:${id}:${user?.id}`, () => getClub(id));
  const club = resource.data;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function membership() {
    setBusy(true);
    try {
      await toggleClubMembership(id);
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    try {
      await deleteClub(id);
      navigate("/clubs");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <Link className="text-link" to="/clubs">
        All clubs & groups
      </Link>
      <div style={{ height: 20 }} />
      <ResourceState resource={resource}>
        {club && (
          <>
            <PageHeader
              eyebrow={`04 / CONNECT · ${club.sport}`}
              title={club.name}
              description={`${club.city} · ${club.members} ${club.members === 1 ? "member" : "members"}`}
            >
              {club.joined && (
                <Link
                  className="button primary"
                  to={`/sessions/new?club=${club.id}`}
                >
                  Organise a session
                </Link>
              )}
            </PageHeader>
            <div className="detail-layout">
              <div className="page-stack">
                <section className="panel panel-pad">
                  <h2>About the group</h2>
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
                    {club.description}
                  </p>
                </section>
                <section className="panel panel-pad">
                  <h2>Next sessions</h2>
                  <div style={{ marginTop: 20 }}>
                    {club.sessions?.length ? (
                      club.sessions.map((e) => (
                        <EventCard key={e.id} event={e} />
                      ))
                    ) : (
                      <EmptyState title="The next plan starts with you.">
                        Join the group and organise a session that works for
                        you.
                      </EmptyState>
                    )}
                  </div>
                </section>
              </div>
              <aside className="panel panel-pad" style={{ alignSelf: "start" }}>
                <h2>
                  {club.joined ? "You’re part of it." : "Find your people."}
                </h2>
                <p className="source-note" style={{ marginBottom: 22 }}>
                  {club.joined
                    ? "Your display name is visible to other members."
                    : "Joining makes your display name visible to other members."}
                </p>
                {user ? (
                  club.owned ? (
                    <p className="small muted">You organise this group.</p>
                  ) : (
                    <button
                      className={`button ${club.joined ? "secondary" : "primary"}`}
                      disabled={busy}
                      onClick={membership}
                    >
                      {busy
                        ? "Updating…"
                        : club.joined
                          ? "Leave group"
                          : "Join group"}
                    </button>
                  )
                ) : (
                  <Link
                    className="button primary"
                    to={`/auth?next=/clubs/${id}`}
                  >
                    Sign in to join
                  </Link>
                )}
                {club.member_names && (
                  <>
                    <div className="divider" />
                    <h3>Members</h3>
                    <p className="source-note">
                      {club.member_names.join(", ")}
                    </p>
                  </>
                )}
                {club.owned && (
                  <>
                    <div className="divider" />
                    {confirm ? (
                      <>
                        <p className="source-note">
                          The group and its membership list will be removed. Its
                          sessions will remain as independent plans.
                        </p>
                        <button className="text-button danger" onClick={remove}>
                          Confirm delete
                        </button>
                        <button
                          className="text-button"
                          style={{ marginLeft: 15 }}
                          onClick={() => setConfirm(false)}
                        >
                          Keep group
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-button danger"
                        onClick={() => setConfirm(true)}
                      >
                        Delete group
                      </button>
                    )}
                  </>
                )}
                {error && (
                  <p className="notice error" role="alert">
                    {error}
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </ResourceState>
    </>
  );
}
export default function ClubsPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const activity = ACTIVITIES.includes(params.get("activity"))
    ? params.get("activity")
    : "";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const resource = useResource(`clubs:${search}:${activity}:${user?.id}`, () =>
    getClubs(search, activity),
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const c = await createClub(Object.fromEntries(f));
      navigate(`/clubs/${c.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="04 / CONNECT"
        title="Good company. Your kind of play."
        description="Find people to train, play or watch with. Or make a space for the people who haven’t found theirs yet."
      >
        {user ? (
          <button
            className="button primary"
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "Close form" : "Start a group"}
          </button>
        ) : (
          <Link
            className="button primary"
            to={`/auth?next=${encodeURIComponent(`/clubs${activity ? `?activity=${activity}` : ""}`)}`}
          >
            Sign in to start a group
          </Link>
        )}
      </PageHeader>
      {activity && (
        <p className="source-note" style={{ marginBottom: 20 }}>
          Showing {activity} groups.{" "}
          <Link className="text-link" to="/clubs">
            Browse all groups
          </Link>
        </p>
      )}
      {adding && user && (
        <form
          className="panel panel-pad"
          style={{ marginBottom: 25 }}
          onSubmit={submit}
        >
          <h2>Start something good.</h2>
          <div className="form-grid" style={{ marginTop: 20 }}>
            <label>
              Group name
              <input
                name="name"
                minLength={3}
                maxLength={100}
                required
                placeholder="A name people will remember"
              />
            </label>
            <label>
              Activity
              <select name="sport" defaultValue={activity || "running"}>
                {ACTIVITIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="full">
              City or town
              <input
                name="city"
                defaultValue={
                  preferences.location.name === "Your location"
                    ? ""
                    : preferences.location.name
                }
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label className="full">
              What’s the group about?
              <textarea
                name="description"
                minLength={10}
                maxLength={2000}
                rows={3}
                required
                placeholder="Who it’s for, what you enjoy, and what joining will feel like."
              />
            </label>
          </div>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary"
            disabled={busy}
            style={{ marginTop: 20 }}
          >
            {busy ? "Creating…" : "Create group"}
          </button>
          <p className="source-note">
            Group details are public. Membership names are visible to other
            members.
          </p>
        </form>
      )}
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          if (search === query.trim()) resource.reload();
          else setSearch(query.trim());
        }}
      >
        <SearchField
          label="Find a group"
          placeholder="Search by name or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="button secondary">Find a group</button>
      </form>
      <ResourceState resource={resource}>
        {resource.data?.clubs?.length ? (
          <div className="three-columns">
            {resource.data.clubs.map((c) => (
              <article className="panel club-card" key={c.id}>
                <p className="eyebrow">
                  {c.sport} · {c.city}
                </p>
                <h2>{c.name}</h2>
                <p>
                  {c.description.slice(0, 160)}
                  {c.description.length > 160 ? "…" : ""}
                </p>
                <div className="club-actions">
                  <Link className="text-link" to={`/clubs/${c.id}`}>
                    View group
                  </Link>
                  <span className="small muted">
                    {c.members} members{c.joined ? " · Joined" : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="panel">
            <EmptyState title="There’s room for your kind of group.">
              {search
                ? "Try another city or a shorter name."
                : "No groups have been created here yet. Start one and invite people to join."}
            </EmptyState>
          </section>
        )}
      </ResourceState>
    </>
  );
}
