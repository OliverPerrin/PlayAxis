import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getStandings } from "../api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  SourceNote,
} from "../components/ui";
import { LEAGUES } from "../utils/sports";
export default function LeaderboardsPage() {
  const [params, setParams] = useSearchParams();
  const sport = params.get("sport") || "bundesliga";
  const resource = useResource(`standings:${sport}`, () => getStandings(sport));
  useEffect(() => {
    if (resource.data?.pending) {
      const timer = setTimeout(resource.reload, 20000);
      return () => clearTimeout(timer);
    }
  }, [resource.data?.pending, resource.reload]);
  return (
    <>
      <PageHeader
        eyebrow="See where they stand"
        title="League standings"
        description="Real tables and championship points, with each source and season clearly shown."
      >
        <select
          aria-label="Choose league"
          value={sport}
          onChange={(e) => setParams({ sport: e.target.value })}
        >
          {LEAGUES.map((l) => (
            <option value={l.key} key={l.key}>
              {l.name}
            </option>
          ))}
        </select>
      </PageHeader>
      <div className="inline-links">
        <Link to={`/matches?sport=${sport}`}>Fixtures & results</Link>
        <Link to={`/events?sport=${sport}`}>Calendar</Link>
      </div>
      <ResourceState resource={resource}>
        {resource.data?.pending && (
          <div className="notice">
            <p>{resource.data.coverage}</p>
          </div>
        )}
        {resource.data?.stale && (
          <div className="notice">
            <p>
              Showing the last complete records while a refresh runs in the
              background.
            </p>
          </div>
        )}
        {resource.data?.limited && (
          <div className="notice">
            <p>{resource.data.coverage}</p>
          </div>
        )}
        {resource.data?.tables?.length ? (
          resource.data.tables.map((t) => (
            <section className="panel" key={t.name}>
              <div className="table-wrap">
                <table>
                  <caption>
                    {t.name}
                    {resource.data.season ? (
                      <span className="small muted" style={{ marginLeft: 12 }}>
                        Season{" "}
                        {String(resource.data.season).replace(
                          /^(\d{4})(\d{4})$/,
                          "$1 / $2",
                        )}
                      </span>
                    ) : (
                      ""
                    )}
                  </caption>
                  <thead>
                    <tr>
                      {t.columns.map((c) => (
                        <th scope="col" key={c}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.length ? (
                      t.rows.map((r, i) => (
                        <tr key={`${r.Team || r.Driver}:${i}`}>
                          {t.columns.map((c) => (
                            <td key={c}>{r[c] ?? "Not available"}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={t.columns.length}>
                          No standings have been published for this season.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        ) : (
          <section className="panel">
            <EmptyState
              title={
                resource.data?.pending
                  ? "Preparing complete season records"
                  : "No table is available yet"
              }
            >
              {resource.data?.pending
                ? "This page will check again automatically. You can explore fixtures while it refreshes."
                : "Try another league or refresh in a moment. Coverage is described below."}
            </EmptyState>
          </section>
        )}
      </ResourceState>
      <SourceNote data={resource.data} />
    </>
  );
}
