import React, { createContext, useContext, useState } from "react";
const PreferencesContext = createContext();
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function PreferencesProvider({ children }) {
  const [preferences, set] = useState(() =>
    read("playaxis.preferences", {
      units: "metric",
      location: {
        name: "London",
        country: "United Kingdom",
        latitude: 51.5072,
        longitude: -0.1276,
      },
    }),
  );
  const [saved, setSaved] = useState(() => read("playaxis.saved", []));
  const [savedPlaces, setSavedPlaces] = useState(() =>
    read("playaxis.places", []),
  );
  const [followedTeams, setFollowedTeams] = useState(() =>
    read("playaxis.teams", []),
  );
  const togglePlace = (place) =>
    setSavedPlaces((prev) => {
      const next = prev.some((p) => p.id === place.id)
        ? prev.filter((p) => p.id !== place.id)
        : [...prev, place];
      localStorage.setItem("playaxis.places", JSON.stringify(next));
      return next;
    });
  const toggleTeam = (team) =>
    setFollowedTeams((prev) => {
      const next = prev.some((p) => p.idTeam === team.idTeam)
        ? prev.filter((p) => p.idTeam !== team.idTeam)
        : [...prev, team];
      localStorage.setItem("playaxis.teams", JSON.stringify(next));
      return next;
    });
  const update = (patch) =>
    set((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("playaxis.preferences", JSON.stringify(next));
      return next;
    });
  const toggleSaved = (event) =>
    setSaved((prev) => {
      const next = prev.some((e) => e.id === event.id)
        ? prev.filter((e) => e.id !== event.id)
        : [...prev, event];
      localStorage.setItem("playaxis.saved", JSON.stringify(next));
      return next;
    });
  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        update,
        saved,
        toggleSaved,
        savedPlaces,
        togglePlace,
        followedTeams,
        toggleTeam,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
export const usePreferences = () => useContext(PreferencesContext);
