import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useResource from "../hooks/useResource";
import { getWatch } from "../api";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  SourceNote,
  safeURL,
} from "../components/ui";
export default function WatchPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "sports";
  const gaming = [
    "esports",
    "counter-strike",
    "league-of-legends",
    "valorant",
  ].includes(category);
  const [selected, setSelected] = useState(null);
  const resource = useResource(`watch:${category}`, () => getWatch(category));
  const streams = resource.data?.data || [];
  const active =
    streams.find((s) => s.id === selected) ||
    (category === "chess" ? streams[0] : null);
  const embed = active
    ? category === "chess"
      ? active.embed_url
      : `https://player.twitch.tv/?channel=${encodeURIComponent(active.user_login)}&parent=${encodeURIComponent(window.location.hostname)}&autoplay=false`
    : null;
  return (
    <>
      <PageHeader eyebrow="02 / FOLLOW" title="Live now">
        <button className="button secondary" onClick={resource.reload}>
          Refresh broadcasts
        </button>
      </PageHeader>
      <div className="segmented">
        {[
          ["sports", "Sport"],
          ["esports", "Gaming & esports"],
          ["chess", "Live chess"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={
              category === id || (id === "esports" && gaming) ? "active" : ""
            }
            aria-pressed={category === id || (id === "esports" && gaming)}
            onClick={() => {
              setSelected(null);
              setParams({ category: id });
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {gaming && (
        <div className="toolbar">
          <label htmlFor="watch-game" style={{ margin: 0 }}>
            Choose a game
          </label>
          <select
            id="watch-game"
            value={category}
            onChange={(e) => {
              setSelected(null);
              setParams({ category: e.target.value });
            }}
          >
            <option value="esports">All supported games</option>
            <option value="counter-strike">Counter-Strike</option>
            <option value="league-of-legends">League of Legends</option>
            <option value="valorant">VALORANT</option>
          </select>
        </div>
      )}
      <ResourceState resource={resource}>
        {active && (
          <section className="panel" style={{ marginBottom: 27 }}>
            <div className="panel-pad section-title" style={{ margin: 0 }}>
              <div>
                <p className="eyebrow">
                  {category === "chess"
                    ? "LICHESS"
                    : active.game_name || "TWITCH"}
                </p>
                <h2>{active.title}</h2>
                <p>
                  {active.user_name}
                  {active.viewer_count != null
                    ? ` · ${active.viewer_count.toLocaleString()} viewers`
                    : active.rating
                      ? ` · Rating ${active.rating}`
                      : ""}
                </p>
              </div>
              <a
                className="button secondary"
                href={safeURL(active.url)}
                target="_blank"
                rel="noreferrer"
              >
                Open on {category === "chess" ? "Lichess" : "Twitch"}
              </a>
            </div>
            <iframe
              title={`${active.title} broadcast`}
              className="stream-frame"
              style={{ height: category === "chess" ? 480 : "min(58vw,620px)" }}
              src={embed}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <p className="source-note" style={{ padding: "0 23px 18px" }}>
              If your browser blocks the embedded player, use the provider link
              above.
            </p>
          </section>
        )}
        {streams.length ? (
          <div className="stream-grid">
            {streams.map((s) => (
              <article className="panel broadcast-card" key={s.id}>
                {safeURL(s.thumbnail_url) && (
                  <img
                    src={safeURL(s.thumbnail_url)}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="broadcast-info">
                  <p className="eyebrow">{s.game_name || s.title}</p>
                  <h3 title={s.title}>
                    {category === "chess" ? s.user_name : s.title}
                  </h3>
                  <p>
                    {category === "chess"
                      ? `Featured game${s.rating ? ` · Rating ${s.rating}` : ""}`
                      : `${s.user_name} · ${s.viewer_count.toLocaleString()} viewers`}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSelected(s.id);
                      window.scrollTo({
                        top: 200,
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                      });
                    }}
                  >
                    {active?.id === s.id ? "Selected broadcast" : "Watch here"}
                  </button>
                  <a
                    className="text-link"
                    style={{ marginLeft: 18 }}
                    href={safeURL(s.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Provider page
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="panel">
            <EmptyState title="No broadcasts in this category right now.">
              Try another category or refresh in a moment.
            </EmptyState>
          </section>
        )}
      </ResourceState>
      <SourceNote data={resource.data} />
      <p className="source-note">
        Broadcasts are supplied by Twitch and Lichess. Availability and
        broadcast rights depend on the creator and your location.
      </p>
    </>
  );
}
