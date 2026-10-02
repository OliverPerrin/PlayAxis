export function goalAmount(value, metric, units = "metric") {
  return metric === "distance_m"
    ? (value / (units === "imperial" ? 1609.344 : 1000)).toLocaleString(
        undefined,
        { maximumFractionDigits: 1 },
      )
    : metric === "duration_sec"
      ? Math.round(value / 60)
      : value;
}
export function goalUnit(metric, units) {
  return metric === "distance_m"
    ? units === "imperial"
      ? "miles"
      : "km"
    : metric === "duration_sec"
      ? "minutes"
      : "sessions";
}
