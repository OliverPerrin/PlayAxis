import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui";
export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="THE IDEA BEHIND PLAYAXIS"
        title="A world of sport. A place for you."
        description="A place to play, something to follow, a habit to build, and people to share it with."
      />
      <article className="panel panel-pad prose">
        <h2 style={{ marginTop: 0 }}>Four ways to make room for sport.</h2>
        <p>
          <strong>Play</strong> brings together local organiser listings,
          community sessions and places to get moving. <strong>Follow</strong>{" "}
          keeps fixtures, teams, records and broadcasts close.{" "}
          <strong>Train</strong> gives your own effort a home, with a journal,
          timer, goals and comparisons. <strong>Connect</strong> helps people
          start groups and make plans together.
        </p>
        <h2>Real information, with its source in view.</h2>
        <p>
          League feeds come from football-data.org, OpenLigaDB, Jolpica F1, MLB,
          NHL, nflverse and BALLDONTLIE. NBA team records are calculated from
          completed regular-season games; official tiebreak ranks are not
          supplied. Team lookup uses TheSportsDB.
        </p>
        <p>
          Local listings come from Ticketmaster and, when needed, Google Events
          through SerpAPI. Maps use OpenStreetMap contributor data. Weather and
          city lookup use Open-Meteo and GeoNames. Twitch and Lichess supply
          broadcasts and live chess.
        </p>
        <h2>Your progress belongs to you.</h2>
        <p>
          Your training totals and goals use the activities you record. You can
          edit sessions without losing measurement precision, compare your own
          efforts, and export your account data from Settings. Historical
          performance references link to World Athletics, UCI and World
          Aquatics.
        </p>
        <h2>Start where you are.</h2>
        <p>
          <Link to="/local">Find a local event</Link>,{" "}
          <Link to="/map">explore places to play</Link>,{" "}
          <Link to="/goals">set a goal</Link>, or{" "}
          <Link to="/clubs">find your people</Link>.
        </p>
        <h2>Sources and credits</h2>
        <ul>
          <li>
            <a
              href="https://www.football-data.org/"
              target="_blank"
              rel="noreferrer"
            >
              football-data.org
            </a>{" "}
            and{" "}
            <a
              href="https://www.balldontlie.io/"
              target="_blank"
              rel="noreferrer"
            >
              BALLDONTLIE
            </a>
          </li>
          <li>
            <a
              href="https://github.com/nflverse/nfldata"
              target="_blank"
              rel="noreferrer"
            >
              nflverse / Lee Sharpe
            </a>
            . NFL data normalized by PlayAxis, with{" "}
            <a
              href="https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0 attribution
            </a>
            .
          </li>
          <li>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              © OpenStreetMap contributors
            </a>
          </li>
          <li>
            <a
              href="https://unsplash.com/photos/man-running-on-outdoor-track-UFs5bKHgo4U"
              target="_blank"
              rel="noreferrer"
            >
              Photography by Hannah Coleman on Unsplash
            </a>
          </li>
        </ul>
        <p>
          PlayAxis software is released under the MIT License.{" "}
          <a
            href="https://github.com/OliverPerrin/PlayAxis"
            target="_blank"
            rel="noreferrer"
          >
            View the source on GitHub
          </a>
          . Data and media providers retain their respective terms.
        </p>
      </article>
    </>
  );
}
