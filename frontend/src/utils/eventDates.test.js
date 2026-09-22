import { dateWindow, withinDates } from "./eventDates";

test("event filters use the destination calendar day across timezones", () => {
  const now = new Date("2026-09-26T00:30:00Z");
  expect(dateWindow("today", "America/New_York", now)).toEqual({
    date_from: "2026-09-25",
    date_to: "2026-09-25",
  });
  expect(dateWindow("weekend", "Europe/London", now)).toEqual({
    date_from: "2026-09-26",
    date_to: "2026-09-27",
  });
  expect(
    dateWindow("weekend", "Europe/London", new Date("2026-09-27T10:00:00Z")),
  ).toEqual({ date_from: "2026-09-27", date_to: "2026-09-27" });
  expect(
    withinDates(
      { start: "2026-09-26T00:30:00Z" },
      { date_from: "2026-09-25", date_to: "2026-09-25" },
      "America/New_York",
    ),
  ).toBe(true);
  expect(withinDates({ start: null }, { date_from: "2026-09-25" }, "UTC")).toBe(
    false,
  );
  expect(
    withinDates(
      { start: "2026-09-25" },
      { date_from: "2026-09-25", date_to: "2026-09-25" },
      "Pacific/Auckland",
    ),
  ).toBe(true);
});
