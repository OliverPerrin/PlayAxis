# Production deployment

The live frontend is https://playaxis.netlify.app. Netlify and the existing Koyeb service track this repository's `main` branch. Netlify uses the same-origin `/api` proxy; provider keys remain in Koyeb's environment.

## September 2026 database reconciliation

The existing PostgreSQL database contained the legacy application tables but had no Alembic version table. Before release:

- A private PostgreSQL custom-format backup was created and its archive listing validated.
- Existing columns, types, nullability, primary keys, identity defaults, foreign keys and required uniqueness were checked against the application schema.
- The missing workout user/start-time index was added.
- The compatible legacy schema was adopted at `wkt20250918`, then upgraded to `participation_20260922`.
- Two unused historical Eventbrite columns were intentionally retained. No existing column or record was removed.
- Row counts and checksums for all five pre-existing application tables matched before and after migration.
- The complete public 2025/26 NBA records snapshot was added to the provider cache so the standings page does not need a cold backfill on first use.

Do not repeat the baseline stamp on a versioned database. Future releases should use normal Alembic upgrades. Rolling application code back should leave the additive tables intact, since downgrading would delete newly created user content.

## Runtime configuration

Keep the production database URL and stable signing secret. The database connection requires SSL. Koyeb currently overrides the image command with Uvicorn, so `RUN_MIGRATIONS=1` ensures startup checks the migration head. Its existing Free service and database remain in use.

Netlify uses Node 22, `npm ci` and the committed lockfile. `REACT_APP_API_URL` is blank so requests use the configured API proxy.

## Release verification

A Git push is only the start of release. Confirm Netlify has published the intended commit, Koyeb reports that commit healthy, and GitHub checks pass. Verify `/api/v1/healthz` reports version `3.0.0`; also check `/community`, `/clubs` and `/sessions` because health does not query the database. Run the read-only provider checks against the public site's `/api/v1` base.
