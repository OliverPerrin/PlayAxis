export function dayAt(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function dateWindow(period, timeZone, now = new Date()) {
  if (period === "any") return {};
  const today = dayAt(now, timeZone);
  const start = new Date(`${today}T12:00:00Z`);
  const end = new Date(start);
  if (period === "weekend") {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() + (day === 0 ? 0 : (6 - day + 7) % 7));
    end.setTime(start.getTime());
    if (day !== 0) end.setUTCDate(end.getUTCDate() + 1);
  } else if (period === "week") {
    end.setUTCDate(end.getUTCDate() + 6);
  }
  return {
    date_from: start.toISOString().slice(0, 10),
    date_to: end.toISOString().slice(0, 10),
  };
}
export function withinDates(event, dates, timeZone) {
  if (!dates.date_from && !dates.date_to) return true;
  if (!event.start) return false;
  const day =
    event.start.length === 10
      ? event.start
      : dayAt(new Date(event.start), timeZone);
  return (
    (!dates.date_from || day >= dates.date_from) &&
    (!dates.date_to || day <= dates.date_to)
  );
}
