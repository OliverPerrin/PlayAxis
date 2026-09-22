import React from "react";
import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <section className="panel empty-state">
      <p className="eyebrow">404 · Out of bounds</p>
      <h1>Let’s get you back in the game.</h1>
      <p>This page doesn’t exist, or the address has changed.</p>
      <Link className="button primary" to="/">
        Go to overview
      </Link>
    </section>
  );
}
