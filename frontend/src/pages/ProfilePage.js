import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, updateProfile, updateInterests } from "../api";
import useResource from "../hooks/useResource";
import { PageHeader, AuthGate, ResourceState } from "../components/ui";
const INTERESTS = [
  "running",
  "cycling",
  "swimming",
  "football",
  "basketball",
  "american football",
  "baseball",
  "ice hockey",
  "motorsport",
  "tennis",
  "skiing",
  "esports",
  "walking",
  "hiking",
  "strength",
];
function ProfileForm() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const resource = useResource(`profile:${user.id}`, getProfile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({ full_name: form.get("name").trim() });
      await updateInterests(form.getAll("interests"));
      await refresh();
      setMessage(
        "Your profile has been updated. You can sign in with your updated username or your email.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ResourceState resource={resource}>
      {resource.data && (
        <div className="detail-layout">
          <form className="panel panel-pad" onSubmit={save}>
            <div className="post-head">
              <div
                className="avatar"
                style={{ width: 56, height: 56, fontSize: 18 }}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2>{user.username}</h2>
                <p className="small muted">Your corner of PlayAxis</p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Username / display name
                <input
                  name="name"
                  minLength={2}
                  maxLength={60}
                  defaultValue={resource.data.full_name || user.username}
                  required
                  autoComplete="nickname"
                />
              </label>
              <label>
                Email
                <input value={user.email} readOnly autoComplete="email" />
                <span className="field-help">
                  Your email sign-in stays the same
                </span>
              </label>
            </div>
            <fieldset style={{ border: 0, padding: 0, marginTop: 25 }}>
              <legend style={{ fontWeight: 700, marginBottom: 14 }}>
                Sports you enjoy
              </legend>
              <div className="two-columns" style={{ gap: 10 }}>
                {INTERESTS.map((s) => (
                  <label
                    key={s}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      textTransform: "capitalize",
                      fontWeight: 400,
                    }}
                  >
                    <input
                      style={{ margin: 0, width: 18 }}
                      type="checkbox"
                      name="interests"
                      value={s}
                      defaultChecked={resource.data.interests?.some(
                        (i) => i.name === s,
                      )}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="notice success" role="status">
                {message}
              </p>
            )}
            <button
              className="button primary"
              disabled={busy}
              style={{ marginTop: 20 }}
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>
          <aside className="panel panel-pad" style={{ alignSelf: "start" }}>
            <h3>Your account</h3>
            <p className="source-note" style={{ marginBottom: 20 }}>
              Your workouts stay private. Your community posts use your display
              name.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          </aside>
        </div>
      )}
    </ResourceState>
  );
}
export default function ProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Your PlayAxis"
        title="My profile"
        description="A few details to make this place feel like yours."
      />
      <AuthGate>
        <ProfileForm />
      </AuthGate>
    </>
  );
}
