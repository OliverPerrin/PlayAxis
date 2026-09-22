# PlayAxis design direction

PlayAxis brings physical activity, gaming and event discovery into one field guide. Its identity uses the structure of a sporting programme: condensed display lettering, fine rules, concise labels and original illustrations. Light mode keeps warm cream backgrounds; dark mode keeps charcoal backgrounds. Coral identifies activity, violet identifies gaming/community, amber identifies events and cobalt identifies following sport. Each theme uses its own readable accent and surface colours. There is no green theme, arrow-based navigation or pill information styling.

## Reference study

The references informed product principles, not copied layouts, assets or branding:

- [Strava](https://www.strava.com/features): connect the activity record with progress and community. PlayAxis applies that to exercise, gaming practice and chess through its journal, timer, goals and groups.
- [Wispr Flow](https://wisprflow.ai/): a calm surface and clear primary choices. PlayAxis retains its own condensed sporting typography and three illustrated starting points with brief labels.
- [Linear](https://linear.app/) and its [search documentation](https://linear.app/docs/search): consistent navigation and fast access to features. The PlayAxis feature finder supports Ctrl/Command K and terms such as gaming, VALORANT, practice and tickets.
- [Ticketmaster](https://www.ticketmaster.co.uk/): make location, category and dates obvious when finding something to attend. PlayAxis presents community sessions, dated ticketed events and organiser websites with distinct actions.

## Audience journeys

| Starting point | Available paths |
| --- | --- |
| Athletics | Log an activity, run the timer, set goals, compare sessions, find clubs and places |
| Gaming | Browse live creators by game, watch live chess, record practice, find gaming groups and organise in-person sessions |
| Events and experiences | Filter by location/category/date, see venue coordinates, save plans, join community sessions and visit booking pages |
| Spectating | Follow teams, browse fixtures/results, open standings and watch available broadcasts |

The top navigation keeps Play, Follow, Train and Connect available throughout the app. A full feature finder and footer directory keep less frequent destinations accessible. Event listings and live gaming use the provider images already available. Colour is concentrated in destination cards, navigation, buttons, progress, weather and map markers. The basemap stays neutral for legibility.

Repeated slogans and navigation descriptions have been removed. The overview cards use short labels and two secondary links each. Event location, category, date and Search sit together above the results. Useful league coverage details remain available under expandable source notes. Forms keep essential privacy and validation text without motivational sidebars. Local events initially show 12 listings and community sessions show six, with controls to reveal more. Visitors see discovery first, without empty private training totals.

## Honest presentation

- Game-category Twitch streams include creators and competitive play. They are not presented as a verified tournament schedule.
- Public NBA records are calculated from complete regular-season games, with no invented official tiebreak rank.
- Google Search results are organiser websites, not dated events. They have no fabricated dates or map positions.
- Date filters use the destination timezone where known. Venue details and uncertain times remain source-dependent.
- Clubs and hosted sessions currently use physical cities and venues. Online matchmaking, game-account synchronization and gaming tournament standings are outside the implemented coverage.

The responsive layouts, route behavior and production build were checked in code. Application screenshot and device interaction testing are not claimed.

## Strava decision

Strava account linking is intentionally not implemented. The user chose to keep PlayAxis entirely free. Strava’s current [Standard API requirements](https://developers.strava.com/docs/getting-started/) require an app-owner subscription; the [official FAQ](https://communityhub.strava.com/developers-knowledge-base-14/strava-api-faq-12906) says existing subscribers pay no additional API fee. No subscription, developer application or OAuth connection was created. Manual activity logging and the timer remain available.
