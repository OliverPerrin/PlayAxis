import React from "react";
import { SunIcon, CloudIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { usePreferences } from "../../contexts/PreferencesContext";
import useResource from "../../hooks/useResource";
import { getWeather } from "../../api";
import { ResourceState } from "../ui";
export default function WeatherWidget() {
  const { preferences } = usePreferences();
  const loc = preferences.location;
  const imperial = preferences.units === "imperial";
  const resource = useResource(`weather:${loc.latitude}:${loc.longitude}`, () =>
    getWeather(loc.latitude, loc.longitude),
  );
  const weather = resource.data;
  return (
    <section className="panel weather-panel">
      <div className="weather-top">
        <div>
          <p className="mini-heading">Outdoors today</p>
          <p className="small muted" style={{ marginTop: 5 }}>
            {loc.name}
          </p>
        </div>
        {weather?.current.weather_code > 1 ? <CloudIcon /> : <SunIcon />}
      </div>
      <ResourceState resource={resource}>
        {weather && (
          <>
            <div className="weather-temp">
              {Math.round(
                imperial
                  ? weather.current.temperature_f
                  : weather.current.temperature_c,
              )}
              °
              <span style={{ fontSize: 18, letterSpacing: 0 }}>
                {imperial ? "F" : "C"}
              </span>
            </div>
            <p className="weather-description">{weather.current.description}</p>
            <div className="weather-details">
              <span>
                Wind{" "}
                {Math.round(
                  imperial
                    ? weather.current.windspeed_mph
                    : weather.current.windspeed_kmh,
                )}{" "}
                {imperial ? "mph" : "km/h"}
              </span>
              <Link to="/settings" className="text-link">
                Change city
              </Link>
            </div>
            <div className="forecast">
              {(weather.hourly || [])
                .filter((_, i) => i % 3 === 0)
                .slice(0, 4)
                .map((p) => (
                  <div key={p.time}>
                    {new Date(p.time).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <strong>
                      {Math.round(
                        imperial
                          ? (p.temperature_c * 9) / 5 + 32
                          : p.temperature_c,
                      )}
                      °
                    </strong>
                  </div>
                ))}
            </div>
            <p className="source-note">
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Weather by Open-Meteo
              </a>
              . Forecast times use your device’s timezone.
            </p>
          </>
        )}
      </ResourceState>
    </section>
  );
}
