import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon,
  Squares2X2Icon,
  MapPinIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { NAV_GROUPS, ALL_FEATURES, sectionFor } from "./navigation";
import LocationSearch from "../LocationSearch";
export default function AppShell({ children }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { preferences, update } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const finder = useRef(null);
  const cityDialog = useRef(null);
  const [query, setQuery] = useState("");
  const group = sectionFor(location.pathname);
  const features = ALL_FEATURES.filter((f) =>
    `${f.label} ${f.detail} ${f.groupName} ${f.keywords || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  useEffect(() => {
    finder.current?.close();
    cityDialog.current?.close();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    function key(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        finder.current?.showModal();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function openFinder() {
    setQuery("");
    finder.current.showModal();
  }
  return (
    <div className={`app-shell programme-shell section-${group?.id || "home"}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <Link to="/" className="programme-brand" aria-label="PlayAxis overview">
          PLAY<span>AXIS</span>
          <i aria-hidden="true">/</i>
        </Link>
        <div className="masthead-tools">
          <button
            className="location-control"
            onClick={() => cityDialog.current.showModal()}
          >
            <MapPinIcon />
            <span>{preferences.location.name}</span>
          </button>
          <button
            className="finder-trigger"
            aria-label="Search features"
            onClick={openFinder}
          >
            <MagnifyingGlassIcon />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="icon-button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            onClick={toggleTheme}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          <Link
            className="icon-button account-control"
            to={user ? "/profile" : "/auth"}
            aria-label={user ? "Your profile" : "Sign in"}
          >
            {user ? (
              <span>{user.username.slice(0, 2).toUpperCase()}</span>
            ) : (
              <UserCircleIcon />
            )}
          </Link>
        </div>
      </header>
      <div className="navigation-frame">
        <nav className="intent-navigation" aria-label="Main navigation">
          {NAV_GROUPS.map((g) => (
            <Link
              key={g.id}
              to={g.home}
              className={`intent-nav intent-${g.id} ${group?.id === g.id ? "active" : ""}`}
              aria-current={group?.id === g.id ? "true" : undefined}
            >
              <span className="intent-number">{g.number}</span>
              <strong>{g.name}</strong>
            </Link>
          ))}
        </nav>
        <div className="feature-navigation">
          <nav
            aria-label={group ? `${group.name} features` : "Quick navigation"}
          >
            {(
              group?.links || [
                { to: "/", label: "Overview" },
                { to: "/local", label: "Find an event" },
                { to: "/watch", label: "Watch live" },
                { to: "/goals", label: "Set a goal" },
                { to: "/clubs", label: "Find a club" },
              ]
            ).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) => (isActive ? "selected" : "")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="all-features-button"
            aria-label="All features"
            onClick={openFinder}
          >
            <Squares2X2Icon />
            <span>All features</span>
          </button>
        </div>
      </div>
      <main id="main" tabIndex={-1} className="page-content programme-content">
        {children}
      </main>
      <footer className="programme-footer">
        <div>
          <Link className="footer-wordmark" to="/">
            PLAYAXIS
          </Link>
          <p>Sport. Gaming. Good plans.</p>
        </div>
        <div className="footer-directory">
          {NAV_GROUPS.map((g) => (
            <div key={g.id}>
              <strong>{g.name}</strong>
              {g.links.map((l) => (
                <Link key={l.to} to={l.to}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} PlayAxis</span>
          <div>
            <Link to="/settings">Settings</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
      <dialog
        ref={finder}
        className="feature-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) finder.current.close();
        }}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">YOUR NEXT MOVE</p>
            <h2>Find your way.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close feature finder"
            onClick={() => finder.current.close()}
          >
            <XMarkIcon />
          </button>
        </div>
        <div className="dialog-search">
          <MagnifyingGlassIcon />
          <input
            autoFocus
            aria-label="Find a feature"
            placeholder="Try goals, maps, clubs or live sport"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                finder.current.close();
                navigate(
                  features.length
                    ? features[0].to
                    : `/events?q=${encodeURIComponent(query.trim())}`,
                );
              }
            }}
          />
        </div>
        <div className="feature-results">
          {features.map((f) => (
            <Link key={f.to} to={f.to} onClick={() => finder.current.close()}>
              <span className={`directory-index intent-${f.group}`}>
                {f.groupName}
              </span>
              <div>
                <strong>{f.label}</strong>
                <p>{f.detail}</p>
              </div>
            </Link>
          ))}
          {!features.length && (
            <p className="muted">
              No feature found. You can search the sporting calendar below.
            </p>
          )}
        </div>
        {query.trim() && (
          <button
            className="button secondary"
            onClick={() => {
              finder.current.close();
              navigate(`/events?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            Search sports events for “{query}”
          </button>
        )}
      </dialog>
      <dialog ref={cityDialog} className="city-dialog">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">YOUR STARTING POINT</p>
            <h2>Where are you playing?</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close location search"
            onClick={() => cityDialog.current.close()}
          >
            <XMarkIcon />
          </button>
        </div>
        <LocationSearch
          onSelect={(city) => {
            update({ location: city });
            cityDialog.current.close();
          }}
        />
        <p className="source-note">
          This changes nearby places, local event search and weather on this
          device.
        </p>
      </dialog>
    </div>
  );
}
