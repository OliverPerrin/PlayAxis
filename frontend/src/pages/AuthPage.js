import React, { useState } from "react";
import {
  Link,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
export default function AuthPage() {
  const [params, setParams] = useSearchParams();
  const registerMode = params.get("mode") === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const rawNext = params.get("next") || "/";
  let next = "/";
  try {
    const target = new URL(rawNext, window.location.origin);
    if (
      target.origin === window.location.origin &&
      !target.pathname.startsWith("/auth")
    )
      next = target.pathname + target.search + target.hash;
  } catch {}
  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      if (registerMode) {
        await register(
          form.get("username").trim(),
          form.get("email").trim(),
          form.get("password"),
        );
        setSuccess(
          "Your account is ready. Sign in to start your training log.",
        );
        setParams({ next }, { state: location.state });
      } else {
        await login(form.get("identifier").trim(), form.get("password"));
        navigate(next, { replace: true, state: location.state?.returnState });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel auth-layout">
      <div className="auth-art">
        <img src="/images/track-runner.jpg" alt="" />
        <p className="eyebrow" style={{ color: "#f1e8d8" }}>
          Your pace. Your progress.
        </p>
        <h2>
          Show up
          <br />
          for yourself.
        </h2>
        <p>
          A little effort today.
          <br />A story worth keeping tomorrow.
        </p>
      </div>
      <form
        className="auth-form"
        key={registerMode ? "register" : "login"}
        onSubmit={submit}
      >
        <p className="eyebrow">Welcome to PlayAxis</p>
        <h1>{registerMode ? "Make it your own." : "Good to have you back."}</h1>
        <p>
          {registerMode
            ? "Create an account to record activities and join the community."
            : "Sign in to pick up where you left off."}
        </p>
        {success && (
          <p className="notice success" role="status">
            {success}
          </p>
        )}
        {registerMode ? (
          <>
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                required
                minLength={2}
                maxLength={60}
                placeholder="Your name"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>
          </>
        ) : (
          <label>
            Email or username
            <input
              name="identifier"
              autoComplete="username"
              required
              placeholder="Email or username"
            />
          </label>
        )}
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={registerMode ? "new-password" : "current-password"}
            minLength={registerMode ? 8 : 1}
            maxLength={72}
            required
            placeholder={
              registerMode ? "At least 8 characters" : "Your password"
            }
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Please wait…" : registerMode ? "Create account" : "Sign in"}
        </button>
        <p className="fine-print">
          By continuing, you agree to the <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">Privacy notice</Link>.
        </p>
        <div className="divider" />
        <p className="small muted">
          {registerMode ? "Already have an account?" : "New to PlayAxis?"}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setError("");
              setSuccess("");
              setParams(
                {
                  ...(registerMode ? {} : { mode: "register" }),
                  next,
                },
                { state: location.state },
              );
            }}
          >
            {registerMode ? "Sign in" : "Create an account"}
          </button>
        </p>
        <Link
          className="text-link"
          style={{ display: "inline-block", marginTop: 22 }}
          to="/events"
        >
          Keep exploring without an account
        </Link>
      </form>
    </section>
  );
}
