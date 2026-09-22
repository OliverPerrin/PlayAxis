import React, { act } from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";
import { clearCache } from "./api";

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({
    setView: jest.fn(),
    getZoom: () => 13,
    project: () => ({ x: 0, y: 0 }),
    getContainer: () => global.document.body,
    invalidateSize: jest.fn(),
    fitBounds: jest.fn(),
    flyTo: jest.fn(),
  }),
  useMapEvents: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  clearCache();
  window.scrollTo = jest.fn();
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  global.fetch = jest.fn(async (url) => {
    let data = {};
    if (url.includes("/weather"))
      data = {
        current: {
          temperature_c: 20,
          temperature_f: 68,
          weather_code: 0,
          description: "Clear sky",
          windspeed_kmh: 4,
          windspeed_mph: 2.5,
        },
        hourly: [],
      };
    else if (url.includes("/events"))
      data = { events: [], total: 0, sources: [], unavailable: [] };
    else if (url.includes("/standings"))
      data = { tables: [], coverage: "Test fixture" };
    else if (url.includes("/sports/")) data = { upcoming: [], recent: [] };
    else if (url.endsWith("/sports")) data = { sports: [] };
    else if (url.includes("/community")) data = { posts: [] };
    else if (url.includes("/places")) data = { places: [] };
    else if (url.includes("/sessions")) data = { events: [] };
    else if (url.includes("/clubs")) data = { clubs: [] };
    else if (url.includes("/streams")) data = { data: [] };
    return { ok: true, status: 200, json: async () => data };
  });
});
afterEach(cleanup);

test.each([
  ["/", "What’s your next move?"],
  ["/events?q=football", "The sporting calendar"],
  ["/map", "Find your place."],
  ["/discover", "Explore sports"],
  ["/matches", "Match centre"],
  ["/leaderboards", "League standings"],
  ["/mystats", "My activity"],
  ["/log-workout", "Log an activity"],
  ["/compare", "Compare your effort"],
  ["/community", "The community"],
  ["/profile", "My profile"],
  ["/settings", "Settings"],
  ["/auth", "Good to have you back."],
  ["/auth?mode=register", "Make it your own."],
  ["/about", "A world of sport. A place for you."],
  ["/privacy", "Privacy at PlayAxis"],
  ["/terms", "A few ground rules"],
  ["/contact", "Let’s talk"],
  ["/local", "What’s happening nearby?"],
  ["/sessions/new", "Make the first move."],
  ["/goals", "A goal of your own."],
  ["/clubs", "Good company. Your kind of play."],
  ["/saved", "A few good plans."],
  ["/watch", "Live now"],
  ["/missing-page", "Let’s get you back in the game."],
])(
  "route %s is reachable without a forced landing redirect",
  async (path, heading) => {
    window.history.replaceState({}, "", path);
    await act(async () => {
      render(<App />);
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect(
        screen.queryByText("This page needs another try."),
      ).not.toBeInTheDocument(),
    );
    expect(window.location.pathname).toBe(path.split("?")[0]);
  },
);

test("recording a workout persists the submitted values and opens the training log", async () => {
  const user = { id: 1, username: "TestRunner", email: "runner@example.com" };
  const workouts = [];
  localStorage.setItem("token", "test-token");
  global.fetch.mockImplementation(async (url, options) => {
    let data;
    if (url.endsWith("/auth/me")) data = user;
    else if (url.endsWith("/workouts") && options.method === "POST") {
      data = { id: 1, user_id: 1, ...JSON.parse(options.body) };
      workouts.push(data);
    } else if (url.includes("/workouts?")) data = { workouts };
    else data = {};
    return { ok: true, status: 200, json: async () => data };
  });
  window.history.replaceState({}, "", "/log-workout");
  await act(async () => {
    render(<App />);
  });
  const duration = await screen.findByLabelText("Duration (minutes)");
  const { fireEvent } = require("@testing-library/react");
  fireEvent.change(duration, { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save activity" }));
  });
  expect(
    await screen.findByText("Activity saved. Your training log is up to date."),
  ).toBeInTheDocument();
  expect(workouts).toHaveLength(1);
  expect(workouts[0].duration_sec).toBe(1800);
  expect(workouts[0].distance_m).toBe(5000);
  expect(window.location.pathname).toBe("/mystats");
});

test("feature finder makes goals directly reachable", async () => {
  const { fireEvent, within } = require("@testing-library/react");
  window.history.replaceState({}, "", "/");
  await act(async () => {
    render(<App />);
  });
  fireEvent.click(screen.getByRole("button", { name: "All features" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(
    within(dialog).getByRole("textbox", { name: "Find a feature" }),
    { target: { value: "goals" } },
  );
  await act(async () => {
    fireEvent.click(within(dialog).getByRole("link", { name: /My goals/ }));
  });
  expect(window.location.pathname).toBe("/goals");
  expect(
    screen.getByRole("heading", { level: 1, name: "A goal of your own." }),
  ).toBeInTheDocument();
});

test("authentication keeps the selected club in the return URL", async () => {
  const { within } = require("@testing-library/react");
  window.history.replaceState({}, "", "/sessions/new?club=42");
  await act(async () => {
    render(<App />);
  });
  const gate = screen
    .getByRole("heading", { name: "Bring people together." })
    .closest("section");
  const link = within(gate).getByRole("link", { name: "Sign in" });
  expect(new URL(link.href).searchParams.get("next")).toBe(
    "/sessions/new?club=42",
  );
});

test("editing only notes preserves full distance, start seconds and duration", async () => {
  const { fireEvent } = require("@testing-library/react");
  const record = {
    id: 77,
    sport: "running",
    started_at: "2026-01-15T12:15:43Z",
    duration_sec: 1801,
    distance_m: 5000.125,
    notes: "Original",
    units: { system: "metric", pace_mode: "time_per_distance" },
  };
  let updated;
  localStorage.setItem("token", "test-token");
  localStorage.setItem(
    "playaxis.preferences",
    JSON.stringify({
      units: "imperial",
      location: { name: "London", latitude: 51.5, longitude: -0.12 },
    }),
  );
  global.fetch.mockImplementation(async (url, options) => {
    let data = {};
    if (url.endsWith("/auth/me"))
      data = { id: 1, username: "Editor", email: "editor@example.com" };
    else if (url.endsWith("/workouts/77")) {
      if (options.method === "PUT") updated = JSON.parse(options.body);
      data = { ...record, ...updated };
    } else if (url.includes("/workouts?"))
      data = { workouts: [{ ...record, ...updated }] };
    return { ok: true, status: 200, json: async () => data };
  });
  window.history.replaceState({}, "", "/log-workout?edit=77");
  await act(async () => {
    render(<App />);
  });
  fireEvent.change(await screen.findByLabelText("How did it go?"), {
    target: { value: "Only these notes changed" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  });
  await screen.findByText("Activity saved. Your training log is up to date.");
  expect(updated.distance_m).toBe(5000.125);
  expect(updated.duration_sec).toBe(1801);
  expect(updated.started_at).toBe("2026-01-15T12:15:43Z");
  expect(updated.units).toEqual(record.units);
});

test("a timed session retains its original start when saved", async () => {
  const { fireEvent } = require("@testing-library/react");
  let saved;
  localStorage.setItem("token", "test-token");
  global.fetch.mockImplementation(async (url, options) => {
    let data = {};
    if (url.endsWith("/auth/me"))
      data = { id: 1, username: "Timer", email: "timer@example.com" };
    else if (url.endsWith("/workouts") && options.method === "POST") {
      saved = { id: 1, ...JSON.parse(options.body) };
      data = saved;
    } else if (url.includes("/workouts?"))
      data = { workouts: saved ? [saved] : [] };
    return { ok: true, status: 200, json: async () => data };
  });
  window.history.replaceState(
    {},
    "",
    "/log-workout?duration=1800&started=2026-01-01T23%3A50%3A43Z",
  );
  await act(async () => {
    render(<App />);
  });
  await act(async () => {
    fireEvent.click(
      await screen.findByRole("button", { name: "Save activity" }),
    );
  });
  await screen.findByText("Activity saved. Your training log is up to date.");
  expect(saved.duration_sec).toBe(1800);
  expect(saved.started_at).toBe("2026-01-01T23:50:43.000Z");
});

test("searching a meeting city never submits the session form", async () => {
  const { fireEvent, within } = require("@testing-library/react");
  let published = false;
  localStorage.setItem("token", "test-token");
  global.fetch.mockImplementation(async (url, options) => {
    let data = {};
    if (url.endsWith("/auth/me"))
      data = { id: 1, username: "Host", email: "host@example.com" };
    else if (url.includes("/locations?"))
      data = {
        locations: [
          {
            id: 1,
            name: "Paris",
            country: "France",
            latitude: 48.85,
            longitude: 2.35,
            timezone: "Europe/Paris",
          },
        ],
      };
    else if (url.endsWith("/sessions") && options.method === "POST")
      published = true;
    return { ok: true, status: 200, json: async () => data };
  });
  window.history.replaceState({}, "", "/sessions/new");
  await act(async () => {
    render(<App />);
  });
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Add a meeting point on the map",
    }),
  );
  const form = screen
    .getByRole("button", { name: "Publish session" })
    .closest("form");
  expect(form.querySelector("form")).toBeNull();
  fireEvent.change(
    within(form).getByRole("textbox", { name: "Search for a city" }),
    { target: { value: "Paris" } },
  );
  await act(async () => {
    fireEvent.click(within(form).getByRole("button", { name: "Find city" }));
  });
  await act(async () => {
    fireEvent.click(
      await within(form).findByRole("button", { name: /Paris.*France/ }),
    );
  });
  expect(screen.getByLabelText("City or town")).toHaveValue("Paris");
  expect(published).toBe(false);
});

test("gaming browse exposes a working game filter", async () => {
  const { fireEvent } = require("@testing-library/react");
  window.history.replaceState({}, "", "/watch?category=esports");
  await act(async () => {
    render(<App />);
  });
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Choose a game"), {
      target: { value: "valorant" },
    });
  });
  expect(window.location.search).toBe("?category=valorant");
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/streams?category=valorant"),
    expect.anything(),
  );
});

test("local search displays organiser links without fabricating event details", async () => {
  const { fireEvent } = require("@testing-library/react");
  const fallback = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) =>
    url.includes("/discovery/events")
      ? {
          ok: true,
          status: 200,
          json: async () => ({
            events: [],
            organisers: [
              {
                id: "club-site",
                name: "Cycling Club",
                domain: "example.org",
                url: "https://example.org/rides",
                description: "Weekly rides",
              },
            ],
          }),
        }
      : fallback(url, options),
  );
  window.history.replaceState({}, "", "/local");
  await act(async () => {
    render(<App />);
  });
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Search local events" }),
    );
  });
  expect(
    await screen.findByRole("link", { name: "Browse organiser" }),
  ).toHaveAttribute("href", "https://example.org/rides");
  expect(
    screen.queryByText("Nothing matched this search."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/Website results are not filtered by date/),
  ).toBeInTheDocument();
});
