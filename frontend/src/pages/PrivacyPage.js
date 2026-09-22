import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR INFORMATION"
        title="Privacy at PlayAxis"
        description="What is stored, what is shared, and what you control."
      />
      <article className="panel panel-pad prose">
        <p>Last updated: 22 September 2026.</p>
        <h2>Accounts and private activity</h2>
        <p>
          PlayAxis stores your email address, display name, hashed password and
          selected interests. Your workouts and goals are associated with your
          account and require your authenticated session. The app does not store
          your password as readable text.
        </p>
        <h2>Community participation</h2>
        <p>
          Posts, comments, group descriptions and session details are public.
          Session listings show the host’s display name, venue, time, optional
          meeting point and attendee count. Club member names are visible to
          other members of that club. Your individual workouts and goals are not
          shared in the community.
        </p>
        <h2>On your device</h2>
        <p>
          The app stores your sign-in token, theme, units, selected city,
          event/place bookmarks, followed teams and unsaved activity timer in
          browser local storage. Signing out removes the sign-in token. Clearing
          site data removes these local preferences and saved plans.
        </p>
        <h2>Location and provider requests</h2>
        <p>
          Precise device location is requested only when you choose “Use my
          location”. Coordinates help request weather, nearby places and local
          organiser listings. You can search for a city instead. The app does
          not continuously track your movement.
        </p>
        <p>
          Public place-search and event results may be cached on the server to
          reduce requests and cover outages. These provider caches are not
          linked to your account. A meeting point you publish for a community
          session is public.
        </p>
        <h2>Third-party content</h2>
        <p>
          Sports, weather and discovery requests normally pass through the
          backend. Map tiles, fonts, provider images and embedded Twitch/Lichess
          content load from their providers, which receive the network
          information needed to serve them. External booking and directions
          links open those providers’ services.
        </p>
        <h2>Your choices</h2>
        <p>
          You can remove activities and goals, delete your own posts, leave
          groups and sessions, and cancel sessions you host. Settings exports
          your account records together with device-local preferences and saved
          plans. Contact us for account deletion or privacy help.
        </p>
        <p>
          <Link to="/contact">Contact PlayAxis</Link>.
        </p>
      </article>
    </>
  );
}
