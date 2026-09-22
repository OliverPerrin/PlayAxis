# PlayAxis frontend

React 18, React Router and Leaflet. Run the backend with `python dev.py` from `backend`, then:

```sh
npm ci
npm start
```

The app runs on port 3000 and proxies `/api/v1` to port 8000. `npm run build` emits `build`. Run checks with `CI=true npm test -- --watchAll=false --runInBand`.

## Main files

- `components/layout/navigation.js`: one directory for Play, Follow, Train, Connect and utility links.
- `components/layout/AppShell.js`: masthead, persistent section navigation, location dialog, keyboard feature finder and footer.
- `index.css`: sporting-programme typography, cream/dark foundations, coral/violet/amber/cobalt accents, flat panels, light/dark themes and responsive layouts.
- `api.js`: one API base, request deduplication, timeouts, account handling and cache-generation invalidation.
- `hooks/useResource.js`: current-query guarding and refreshes that preserve visible data and drafts.
- `contexts/PreferencesContext.js`: device preferences, saved events/places and followed teams.
- `components/ActivityTimer.js`: persistent device timer with pause/resume and original start.
- `components/events/EventMap.js`: Leaflet lifecycle, clustering, resize handling and optional meeting-point selection.
- `components/LocationSearch.js`: standalone or embedded city lookup without nested forms.
- `components/ui/FeatureArtwork.js`: original compact activity, gaming and ticket illustrations.
- `pages`: public event discovery, gaming broadcasts, personal activity and community journeys.
- `utils/eventDates.js`: destination-timezone date presets and community-session filtering.

The overview has distinct athletics, gaming and event entry points. Feature search includes common gaming and activity aliases. Local discovery supports event categories, date filters and separate organiser website results. See [design notes](../docs/design.md).

Protected journeys preserve query parameters and selected-place state through sign-in. Workout editing preserves untouched source precision. Goals and community records live on the backend. Browser bookmarks, preferences, follows and the unsaved timer remain device-local.

Provider keys never belong in `REACT_APP_*` variables. See `.env.example` for public backend/tile URL overrides and the [root README](../README.md) for server setup, quotas and deployment boundaries.
