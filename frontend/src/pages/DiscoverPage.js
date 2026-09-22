import React from "react";
import { Link } from "react-router-dom";
import { listSports } from "../api";
import useResource from "../hooks/useResource";
import { PageHeader, ResourceState } from "../components/ui";
export default function DiscoverPage() {
  const resource = useResource("sports-catalogue", listSports);
  return (
    <>
      <PageHeader eyebrow="02 / FOLLOW" title="Explore sports">
        <Link className="button primary" to="/watch">
          Watch live sport
        </Link>
      </PageHeader>
      <ResourceState resource={resource}>
        <div className="three-columns">
          {resource.data?.sports?.map((sport, i) => (
            <article className="panel sport-card" key={sport.key}>
              <span className="sport-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="eyebrow">{sport.sport}</p>
              <h2>{sport.name}</h2>
              <div
                className="inline-links"
                style={{ marginTop: "auto", marginBottom: 0 }}
              >
                <Link to={`/matches?sport=${sport.key}`}>
                  Fixtures & results
                </Link>
                <Link to={`/leaderboards?sport=${sport.key}`}>
                  Table & records
                </Link>
              </div>
              <details className="coverage-details">
                <summary>Coverage & source</summary>
                <p className="source-note">
                  {sport.coverage} {sport.source}.
                </p>
              </details>
            </article>
          ))}
        </div>
      </ResourceState>
      <section className="panel panel-pad" style={{ marginTop: 28 }}>
        <h2>Join in</h2>
        <div className="inline-links" style={{ marginBottom: 0 }}>
          <Link to="/map">Places to play</Link>
          <Link to="/local">Local sessions</Link>
          <Link to="/clubs">Clubs & groups</Link>
        </div>
      </section>
    </>
  );
}
