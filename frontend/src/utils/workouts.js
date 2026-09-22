export const ACTIVITIES = [
  "running",
  "cycling",
  "swimming",
  "walking",
  "hiking",
  "strength",
  "tennis",
  "football",
  "basketball",
  "american football",
  "baseball",
  "ice hockey",
  "rugby",
  "volleyball",
  "badminton",
  "golf",
  "rowing",
  "yoga",
  "skiing",
  "gaming",
  "chess",
  "other",
];
export function totalWorkouts(items) {
  return items.reduce(
    (total, w) => ({
      count: total.count + 1,
      minutes: total.minutes + w.duration_sec / 60,
      distance: total.distance + (w.distance_m || 0) / 1000,
    }),
    { count: 0, minutes: 0, distance: 0 },
  );
}
export function inPeriod(items, days) {
  if (!days) return items;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);
  return items.filter(
    (w) =>
      new Date(w.started_at) >= from && new Date(w.started_at) <= new Date(),
  );
}
export function localDateTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function distanceDisplay(km, units) {
  return (units === "imperial" ? km * 0.621371 : km).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}
export function pace(workout, units = "metric") {
  if (!workout.distance_m) return "No distance";
  const seconds =
    workout.duration_sec /
    (workout.distance_m / (units === "imperial" ? 1609.344 : 1000));
  let minutes = Math.floor(seconds / 60),
    remainder = Math.round(seconds % 60);
  if (remainder === 60) {
    minutes += 1;
    remainder = 0;
  }
  return `${minutes}:${String(remainder).padStart(2, "0")} /${units === "imperial" ? "mi" : "km"}`;
}
