jest.mock("react-leaflet", () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: jest.fn(),
  useMapEvents: jest.fn(),
}));
import { calendarFile } from "./pages/EventDetailPage";
import { inPeriod, totalWorkouts, pace } from "./utils/workouts";
import { hasCoordinates } from "./components/events/EventMap";
import { safeURL, formatDate } from "./components/ui";

test("calendar export refuses missing dates and escapes event metadata", () => {
  expect(calendarFile({ id: "1", start: null })).toBeNull();
  const value = calendarFile({
    id: "1",
    name: "Run, meet; play\nMore",
    start: "2026-09-22T16:00:00Z",
    venue: "Park",
    url: "javascript:alert(1)",
  });
  expect(value).toContain("DTSTART:20260922T160000Z");
  expect(value).toContain("SUMMARY:Run\\, meet\\; play\\nMore");
  expect(value).not.toContain("javascript:");
});

test("map coordinates exclude absent, invalid and out of range locations", () => {
  expect(hasCoordinates({ latitude: null, longitude: 0 })).toBe(false);
  expect(hasCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
  expect(hasCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
  expect(hasCoordinates({ latitude: 51.5, longitude: -0.12 })).toBe(true);
  expect(hasCoordinates({ latitude: 95, longitude: 0 })).toBe(false);
});

test("training totals use recorded data and preserve zero distances", () => {
  const data = [
    { duration_sec: 600, distance_m: 0 },
    { duration_sec: 1200, distance_m: 5000 },
  ];
  expect(totalWorkouts(data)).toEqual({ count: 2, minutes: 30, distance: 5 });
  expect(pace({ duration_sec: 1500, distance_m: 5000 })).toBe("5:00 /km");
  expect(pace({ duration_sec: 300, distance_m: null })).toBe("No distance");
});

test("period filter excludes future and old sessions", () => {
  const now = Date.now();
  const items = [
    { started_at: new Date(now - 3600000).toISOString() },
    { started_at: new Date(now - 9 * 86400000).toISOString() },
    { started_at: new Date(now + 86400000).toISOString() },
  ];
  expect(inPeriod(items, 7)).toHaveLength(1);
});

test("external links and missing dates remain safe and explicit", () => {
  expect(safeURL("javascript:alert(1)")).toBeUndefined();
  expect(safeURL("https://example.com/path")).toBe("https://example.com/path");
  expect(formatDate(null)).toBe("Date to be confirmed");
});
