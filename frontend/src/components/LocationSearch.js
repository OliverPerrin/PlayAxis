import React, { useState } from "react";
import { searchLocations } from "../api";
import { SearchField } from "./ui";
export default function LocationSearch({ onSelect, embedded = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function search(e) {
    e.preventDefault();
    e.stopPropagation();
    if (query.trim().length < 2) {
      setError("Enter at least two letters.");
      return;
    }
    setBusy(true);
    setError("");
    setResults(null);
    try {
      const data = await searchLocations(query.trim());
      setResults(data.locations);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const controls = (
    <>
      <SearchField
        label="Search for a city"
        placeholder="Search a city or town"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        minLength={embedded ? undefined : 2}
        required={!embedded}
        onKeyDown={(e) => {
          if (embedded && e.key === "Enter") search(e);
        }}
      />
      <button
        type={embedded ? "button" : "submit"}
        className="button secondary"
        disabled={busy}
        onClick={embedded ? search : undefined}
      >
        {busy ? "Searching…" : "Find city"}
      </button>
    </>
  );
  return (
    <div>
      {embedded ? (
        <div className="toolbar" style={{ marginBottom: 0 }}>
          {controls}
        </div>
      ) : (
        <form className="toolbar" style={{ marginBottom: 0 }} onSubmit={search}>
          {controls}
        </form>
      )}
      {error && (
        <p role="alert" className="field-help danger">
          {error}
        </p>
      )}
      {results &&
        (results.length ? (
          <ul className="city-results">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect({
                      name: r.name,
                      country: r.country,
                      latitude: r.latitude,
                      longitude: r.longitude,
                      timezone: r.timezone,
                    });
                    setResults(null);
                    setQuery("");
                  }}
                >
                  {r.name}
                  <span>
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field-help">
            No matching cities. Try a nearby town or include the country.
          </p>
        ))}
    </div>
  );
}
