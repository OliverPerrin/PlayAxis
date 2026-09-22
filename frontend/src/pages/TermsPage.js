import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";
export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Using PlayAxis" title="A few ground rules" />
      <article className="panel panel-pad prose">
        <p>Last updated: 22 September 2026.</p>
        <h2>The service</h2>
        <p>
          PlayAxis helps you explore sporting events and places, follow
          fixtures, and record personal activities. It is an information and
          tracking tool. External bookings take place with the organiser.
          Community sessions are hosted by their named members, who manage their
          plans and communicate changes.
        </p>
        <h2>Check the source</h2>
        <p>
          Schedules, results, weather forecasts and map information are supplied
          by third parties. They may be incomplete, delayed or unavailable.
          Confirm event times, access, prices and bookings with the organiser or
          venue before travelling.
        </p>
        <h2>Your account and contributions</h2>
        <p>
          Keep your sign-in details secure. Share content you have the right to
          share. Do not post abusive, unlawful, misleading or private personal
          information. You can delete your own posts. Contact us to report a
          concern.
        </p>
        <h2>Personal activity information</h2>
        <p>
          Workout comparisons provide context for your own records. They are not
          medical advice, personalised coaching or a measure of your ability
          against a population.
        </p>
        <h2>Third-party content</h2>
        <p>
          Source data, map tiles, photographs and broadcasts remain subject to
          their owners’ terms. The application’s MIT software licence does not
          replace those terms.
        </p>
        <h2>Questions</h2>
        <p>
          <Link to="/contact">Contact PlayAxis</Link> if something is unclear or
          isn’t working as expected.
        </p>
      </article>
    </>
  );
}
