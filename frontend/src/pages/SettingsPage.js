import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useAuth } from "../contexts/AuthContext";
import { getAccountExport } from "../api";
import { PageHeader, downloadFile } from "../components/ui";
import LocationSearch from "../components/LocationSearch";
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { preferences, update, saved, savedPlaces, followedTeams } =
    usePreferences();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  async function exportData() {
    setBusy(true);
    try {
      const account = user ? await getAccountExport() : {};
      downloadFile(
        "playaxis-data.json",
        JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            profile: user,
            preferences,
            saved_events: saved,
            ...account,
            saved_places: savedPlaces,
            followed_teams: followedTeams,
          },
          null,
          2,
        ),
      );
      setFeedback("Your export is ready.");
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader eyebrow="Make yourself at home" title="Settings" />
      <div className="page-stack" style={{ maxWidth: 900 }}>
        <section className="panel panel-pad">
          <h2>Your preferences</h2>
          <div className="settings-row">
            <div>
              <h3>Appearance</h3>
            </div>
            <select
              aria-label="Appearance"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <h3>Distance & weather units</h3>
              <p>Activity, comparisons and weather.</p>
            </div>
            <select
              aria-label="Units"
              value={preferences.units}
              onChange={(e) => update({ units: e.target.value })}
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </div>
          <p className="source-note">
            Appearance, units, saved events and your chosen city are saved on
            this device.
          </p>
        </section>
        <section className="panel panel-pad">
          <h2>Your starting point</h2>
          <p className="muted small" style={{ margin: "10px 0 22px" }}>
            Weather and nearby places currently start in{" "}
            {preferences.location.name}. Choose a different city below.
          </p>
          <LocationSearch
            onSelect={(city) => {
              update({ location: city });
              setFeedback(`Starting location changed to ${city.name}.`);
            }}
          />
          <p className="source-note">
            City search by Open-Meteo and GeoNames. Your device’s precise
            location is requested only when you choose “Use my location”.
          </p>
        </section>
        <section className="panel panel-pad">
          <h2>Your data</h2>
          <div className="settings-row">
            <div>
              <h3>Take a copy with you</h3>
              <p>
                Download your preferences, saved events, places and teams
                {user
                  ? ", plus your activities, goals, groups and community contributions"
                  : ""}{" "}
                as JSON.
              </p>
            </div>
            <button
              className="button secondary"
              disabled={busy}
              onClick={exportData}
            >
              {busy ? "Preparing…" : "Export data"}
            </button>
          </div>
          <p className="source-note">
            For account help or a deletion request,{" "}
            <Link className="text-link" to="/contact">
              contact PlayAxis
            </Link>
            .
          </p>
        </section>
        {feedback && (
          <p className="notice" role="status">
            {feedback}
          </p>
        )}
      </div>
    </>
  );
}
