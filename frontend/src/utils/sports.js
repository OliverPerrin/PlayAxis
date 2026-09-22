export const LEAGUES = [
  { key: "bundesliga", name: "Bundesliga", sport: "Football" },
  { key: "f1", name: "Formula 1", sport: "Motorsport" },
  { key: "mlb", name: "MLB", sport: "Baseball" },
  { key: "nhl", name: "NHL", sport: "Ice hockey" },
  { key: "epl", name: "Premier League", sport: "Football" },
  { key: "nba", name: "NBA", sport: "Basketball" },
  { key: "nfl", name: "NFL", sport: "American football" },
];
export const SPORT_OPTIONS = LEAGUES.map((l) => ({
  value: l.key,
  label: l.name,
}));
export const canonicalSportKey = (key) => key;
export function sportLabel(key) {
  return LEAGUES.find((l) => l.key === key)?.name || key;
}
