import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const KEY = "playaxis.activityTimer";
function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return value && Number.isFinite(value.elapsed)
      ? value
      : { elapsed: 0, started: null, origin: null };
  } catch {
    return { elapsed: 0, started: null, origin: null };
  }
}
export default function ActivityTimer() {
  const [timer, setTimer] = useState(read);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(timer));
  }, [timer]);
  useEffect(() => {
    if (!timer.started) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer.started]);
  const seconds = Math.max(
    0,
    timer.elapsed +
      (timer.started ? Math.floor((now - timer.started) / 1000) : 0),
  );
  const clock = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
  function start() {
    const stamp = Date.now();
    setNow(stamp);
    setTimer((t) => ({
      ...t,
      started: stamp,
      origin: t.origin || stamp - t.elapsed * 1000,
    }));
  }
  function pause() {
    const stamp = Date.now();
    setTimer((t) => ({
      origin: t.origin || t.started - t.elapsed * 1000,
      elapsed: t.elapsed + Math.max(0, Math.floor((stamp - t.started) / 1000)),
      started: null,
    }));
  }
  return (
    <section className="panel timer-panel">
      <div>
        <p className="eyebrow">TIME TO MOVE</p>
        <h2>A little time for yourself.</h2>
        <p className="source-note">
          Start the timer, pause when you’re done, then use the time in your
          activity log.
        </p>
      </div>
      <div className="timer-controls">
        <output aria-label="Elapsed activity time" className="timer-clock">
          {clock}
        </output>
        <div className="form-actions" style={{ marginTop: 12 }}>
          {timer.started ? (
            <button className="button primary" onClick={pause}>
              Pause timer
            </button>
          ) : (
            <button className="button primary" onClick={start}>
              {seconds ? "Resume" : "Start timer"}
            </button>
          )}
          {!timer.started && seconds > 0 && (
            <>
              <Link
                className="button secondary"
                to={
                  seconds <= 604800
                    ? `/log-workout?duration=${seconds}&started=${encodeURIComponent(new Date(timer.origin || Date.now() - seconds * 1000).toISOString())}`
                    : "/log-workout"
                }
              >
                {seconds <= 604800 ? "Use this time" : "Enter time manually"}
              </Link>
              <button
                className="text-button"
                onClick={() =>
                  setTimer({ elapsed: 0, started: null, origin: null })
                }
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
