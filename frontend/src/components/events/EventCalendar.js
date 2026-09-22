import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function EventCalendar({ events = [] }) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const start = new Date(month);
  start.setDate(1 - ((start.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
  const move = (n) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  return (
    <section>
      <div className="calendar-toolbar">
        <h2>
          {month.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div>
          <button className="button secondary" onClick={() => move(-1)}>
            Previous
          </button>
          <button
            className="button secondary"
            onClick={() =>
              setMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
          >
            Today
          </button>
          <button className="button secondary" onClick={() => move(1)}>
            Next
          </button>
        </div>
      </div>
      <div className="calendar">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div className="calendar-header" key={d}>
            {d}
          </div>
        ))}
        {cells.map((date) => (
          <div
            key={date.toISOString()}
            className={`calendar-day ${date.getMonth() !== month.getMonth() ? "other" : ""} ${date.toDateString() === new Date().toDateString() ? "today" : ""}`}
          >
            <time dateTime={date.toISOString()}>{date.getDate()}</time>
            {events
              .filter(
                (e) => new Date(e.start).toDateString() === date.toDateString(),
              )
              .map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  state={{ event: e }}
                  title={e.name}
                >
                  {e.name}
                </Link>
              ))}
          </div>
        ))}
      </div>
      <p className="source-note">
        Only events available in the selected provider feed are shown.
      </p>
    </section>
  );
}
