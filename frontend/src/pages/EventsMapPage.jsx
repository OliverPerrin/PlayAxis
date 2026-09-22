import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPinIcon } from "@heroicons/react/24/outline";
import EventMap, { hasCoordinates } from "../components/events/EventMap";
import LocationSearch from "../components/LocationSearch";
import {
  PageHeader,
  Loading,
  ErrorState,
  EmptyState,
  formatDate,
} from "../components/ui";
import { usePreferences } from "../contexts/PreferencesContext";
import useResource from "../hooks/useResource";
import { getPlaces, getSessions, searchLocalEvents } from "../api";
export default function EventsMapPage() {
  const { preferences, update, savedPlaces, togglePlace } = usePreferences();
  const loc = preferences.location;
  const [params, setParams] = useSearchParams();
  const layer = params.get("layer") || "places";
  const [searchCenter, setSearchCenter] = useState(loc);
  const [viewport, setViewport] = useState(null);
  const [selected, setSelected] = useState(null);
  const [radius, setRadius] = useState(1500);
  const [fitKey, setFitKey] = useState(0);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const [sport, setSport] = useState(params.get("type") || "");
  useEffect(() => {
    setSearchCenter(loc);
    setSelected(null);
  }, [loc]);
  const center = useMemo(
    () => [searchCenter.latitude, searchCenter.longitude],
    [searchCenter],
  );
  const resource = useResource(
    `${layer}:${center.join(",")}:${radius}:${layer === "events" ? sport : ""}`,
    async () => {
      if (layer === "places") return getPlaces(center[0], center[1], radius);
      const results = await Promise.allSettled([
        getSessions(
          searchCenter.name === "Your location" ||
            searchCenter.name === "this area"
            ? ""
            : searchCenter.name,
          sport,
        ),
        searchLocalEvents(searchCenter, sport || "all"),
      ]);
      const valid = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      if (!valid.length)
        throw new Error(
          "Event listings are temporarily unavailable. Please retry.",
        );
      const events = valid.flatMap((r) => r.events || []);
      const nearby = (p) => {
        const rad = (value) => (value * Math.PI) / 180;
        const dy = rad(p.latitude - center[0]),
          dx = rad(p.longitude - center[1]);
        const a =
          Math.sin(dy / 2) ** 2 +
          Math.cos(rad(center[0])) *
            Math.cos(rad(p.latitude)) *
            Math.sin(dx / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 30;
      };
      return {
        places: events.filter(hasCoordinates).filter(nearby),
        limited: valid.some((r) => r.total > (r.events?.length || 0)),
        unmapped: events.filter((e) => !hasCoordinates(e)).length,
        organisers: valid.reduce((n, r) => n + (r.organisers?.length || 0), 0),
        warning: results.some((r) => r.status === "rejected")
          ? "Some event sources are unavailable. Available events are shown."
          : null,
      };
    },
  );
  const all = useMemo(() => resource.data?.places || [], [resource.data]);
  const points = useMemo(
    () =>
      sport && layer === "places"
        ? all.filter((p) =>
            `${p.sport || ""} ${p.kind || ""}`
              .toLowerCase()
              .replace(/soccer/g, "football")
              .replace(/_/g, " ")
              .includes(sport),
          )
        : all,
    [all, sport, layer],
  );
  const selectCity = (city) => {
    update({ location: city });
    setSearchCenter(city);
    setSelected(null);
    setGeoError("");
  };
  function locate() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Location is unavailable. Search for a city instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        selectCity({
          name: "Your location",
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setGeoError(
          "We couldn’t access your location. Allow location access or search for a city.",
        );
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  const isSaved = selected && savedPlaces.some((p) => p.id === selected.id);
  return (
    <>
      <PageHeader
        eyebrow="01 / PLAY"
        title="Find your place."
        description="Courts, tracks, pools, parks and the events happening around them."
      >
        <button
          className="button secondary"
          disabled={locating}
          onClick={locate}
        >
          <MapPinIcon />
          {locating ? "Locating…" : "Use my location"}
        </button>
      </PageHeader>
      <div className="section-title">
        <div className="segmented" style={{ margin: 0 }}>
          {[
            ["places", "Places to play"],
            ["events", "Events on the map"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={layer === id ? "active" : ""}
              aria-pressed={layer === id}
              onClick={() => {
                setParams({ layer: id });
                setSelected(null);
                setSport("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Link className="text-link" to="/saved?tab=places">
          Saved places
        </Link>
      </div>
      <div className="two-columns" style={{ marginBottom: 20 }}>
        <LocationSearch onSelect={selectCity} />
        <div
          className="toolbar"
          style={{ margin: 0, justifyContent: "flex-end" }}
        >
          <select
            aria-label="Filter map results"
            value={sport}
            onChange={(e) => {
              setSport(e.target.value);
              setSelected(null);
            }}
          >
            <option value="">All types</option>
            {layer === "events" && (
              <>
                <option value="music">Music</option>
                <option value="arts">Arts & theatre</option>
                <option value="gaming">Gaming</option>
                <option value="chess">Chess</option>
              </>
            )}
            <option value="tennis">Tennis</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="swimming">Swimming</option>
            <option value="fitness">Gyms</option>
            <option value="park">Parks</option>
            <option value="track">Tracks</option>
          </select>
          {layer === "places" && (
            <select
              aria-label="Search radius"
              value={radius}
              onChange={(e) => {
                setSelected(null);
                setRadius(Number(e.target.value));
              }}
            >
              <option value={700}>Within 700 m</option>
              <option value={1500}>Within 1.5 km</option>
              <option value={3000}>Within 3 km</option>
              <option value={5000}>Within 5 km</option>
            </select>
          )}
        </div>
      </div>
      {geoError && (
        <p role="alert" className="notice">
          {geoError}
        </p>
      )}
      {resource.data?.warning && (
        <p className="notice">{resource.data.warning}</p>
      )}
      <div className="map-layout">
        <aside className="map-results" aria-label="Results in this area">
          <p className="map-result-count">
            {resource.loading
              ? "Searching this area"
              : `${points.length} mapped ${layer === "places" ? "places" : "events"}`}{" "}
            · {searchCenter.name}
          </p>
          {resource.loading && !resource.data ? (
            <Loading text="Finding results" />
          ) : resource.error ? (
            <ErrorState message={resource.error} retry={resource.reload} />
          ) : !points.length ? (
            <EmptyState title="Try another area or type.">
              Change the search radius, clear the filter, or find a nearby city.
            </EmptyState>
          ) : (
            points.map((p) => (
              <button
                key={p.id}
                className={`map-result ${selected?.id === p.id ? "selected" : ""}`}
                aria-pressed={selected?.id === p.id}
                onClick={() => setSelected(p)}
              >
                <h3>{p.name}</h3>
                <p>
                  {p.sport || p.kind}
                  {layer === "events"
                    ? ` · ${p.start ? formatDate(p.start) : p.date_text || "Date TBC"}`
                    : ""}
                </p>
                {p.address && <p>{p.address}</p>}
              </button>
            ))
          )}
        </aside>
        <div className="map-canvas">
          <EventMap
            center={center}
            points={points}
            selected={selected}
            onSelect={setSelected}
            fitKey={fitKey}
            onMove={setViewport}
          />
          <div className="map-controls">
            <button
              className="button secondary"
              disabled={resource.loading}
              onClick={() => {
                if (viewport) {
                  setSearchCenter({
                    name: "this area",
                    latitude: Math.max(-85, Math.min(85, viewport.lat)),
                    longitude:
                      ((((viewport.lng + 180) % 360) + 360) % 360) - 180,
                  });
                  setSelected(null);
                } else resource.reload();
              }}
            >
              Search this area
            </button>
            {points.length > 0 && (
              <button
                className="button secondary"
                onClick={() => setFitKey((k) => k + 1)}
              >
                Fit all results
              </button>
            )}
          </div>
          {selected && (
            <div className="map-status">
              <strong>{selected.name}</strong>
              <p className="small muted">
                {selected.sport || selected.kind}
                {selected.opening_hours ? ` · ${selected.opening_hours}` : ""}
              </p>
              <div className="mini-feature-links" style={{ marginTop: 9 }}>
                {layer === "places" ? (
                  <>
                    <button
                      className="text-button"
                      aria-pressed={!!isSaved}
                      onClick={() =>
                        togglePlace({
                          ...selected,
                          city:
                            selected.city ||
                            (["this area", "Your location"].includes(
                              searchCenter.name,
                            )
                              ? ""
                              : searchCenter.name),
                        })
                      }
                    >
                      {isSaved ? "Unsave place" : "Save place"}
                    </button>
                    <Link
                      to="/sessions/new"
                      state={{
                        place: {
                          ...selected,
                          city:
                            selected.city ||
                            (["this area", "Your location"].includes(
                              searchCenter.name,
                            )
                              ? ""
                              : searchCenter.name),
                        },
                      }}
                    >
                      Plan a session here
                    </Link>
                  </>
                ) : (
                  <Link
                    to={`/events/${selected.id}`}
                    state={{ event: selected }}
                  >
                    View event
                  </Link>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="source-note">
        {resource.data?.stale &&
          `Live place search is unavailable. Showing saved places from ${new Date(resource.data.updated_at).toLocaleString()}. `}
        {resource.data?.limited &&
          (layer === "places"
            ? "Showing the first 100 mapped places. Narrow the area to refine the results. "
            : "The organiser source returns up to 100 events. Choose a category, or use Local events to filter dates. ")}
        {resource.data?.unmapped > 0 &&
          `${resource.data.unmapped} listings have no precise coordinates and are available in Local events. `}
        {resource.data?.organisers > 0 && (
          <>
            <Link className="text-link" to="/local">
              Browse organiser websites in Local events.
            </Link>{" "}
          </>
        )}
        {layer === "places"
          ? "Place information from OpenStreetMap contributors. Check opening hours, entry fees and access before going."
          : "Only provided coordinates are plotted. Community meeting points are chosen by organisers. Organiser listings cover up to 30 km from the searched point."}{" "}
        City search by Open-Meteo and GeoNames.
      </p>
    </>
  );
}
