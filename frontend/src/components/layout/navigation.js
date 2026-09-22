export const NAV_GROUPS = [
  {
    id: "play",
    number: "01",
    name: "Play",
    description: "Find your next session",
    home: "/local",
    links: [
      {
        to: "/local",
        label: "Local events",
        detail: "Find activities near your city",
        keywords: "find events ticketmaster tickets races dates",
      },
      {
        to: "/map",
        label: "Places to play",
        detail: "Courts, parks, pools and tracks",
      },
      {
        to: "/saved",
        label: "Saved plans",
        detail: "Your events, places and joined sessions",
      },
      {
        to: "/sessions/new",
        label: "Organise a session",
        detail: "Make a plan and invite people",
      },
    ],
  },
  {
    id: "follow",
    number: "02",
    name: "Follow",
    description: "Stay in the game",
    home: "/matches",
    links: [
      {
        to: "/matches",
        label: "Match centre",
        detail: "Fixtures, scores and followed teams",
      },
      {
        to: "/leaderboards",
        label: "Standings",
        detail: "League tables and championships",
      },
      {
        to: "/watch",
        label: "Live sport & gaming",
        detail: "Sport, esports and live chess",
        keywords:
          "gaming counter-strike cs valorant league of legends lol watch streams",
      },
      {
        to: "/discover",
        label: "Explore sports",
        detail: "Find a league to follow",
      },
      {
        to: "/events",
        label: "Sports calendar",
        detail: "Fixtures in a list or calendar",
      },
    ],
  },
  {
    id: "train",
    number: "03",
    name: "Train",
    description: "Build your own rhythm",
    home: "/mystats",
    links: [
      {
        to: "/mystats",
        label: "My activity",
        detail: "Your personal activity journal",
      },
      {
        to: "/log-workout",
        label: "Log activity",
        detail: "Record a workout or practice session",
        keywords: "timer practice athletics training exercise gaming",
      },
      {
        to: "/goals",
        label: "My goals",
        detail: "Session, distance and time targets",
      },
      {
        to: "/compare",
        label: "Compare",
        detail: "Your sessions and sourced benchmarks",
      },
    ],
  },
  {
    id: "connect",
    number: "04",
    name: "Connect",
    description: "Find your people",
    home: "/community",
    links: [
      {
        to: "/community",
        label: "Community",
        detail: "Share progress and conversations",
      },
      {
        to: "/clubs",
        label: "Clubs & groups",
        detail: "Join a group or start your own",
      },
      {
        to: "/profile",
        label: "My profile",
        detail: "Your interests and account",
      },
    ],
  },
];
export const ALL_FEATURES = NAV_GROUPS.flatMap((group) =>
  group.links.map((link) => ({
    ...link,
    group: group.id,
    groupName: group.name,
  })),
).concat([
  {
    to: "/settings",
    label: "Settings & data export",
    detail: "Theme, units, location and your records",
    group: "utility",
    groupName: "Tools",
  },
  {
    to: "/contact",
    label: "Contact & support",
    detail: "Get help or report a concern",
    group: "utility",
    groupName: "Help",
  },
  {
    to: "/about",
    label: "About PlayAxis",
    detail: "The idea, data sources and credits",
    group: "utility",
    groupName: "About",
  },
]);
export function sectionFor(path) {
  if (/^\/events\/(local-|localweb-|tm-)/.test(path)) return NAV_GROUPS[0];
  return NAV_GROUPS.find((g) =>
    g.links.some(
      (l) =>
        path === l.to ||
        (l.to !== "/sessions/new" && path.startsWith(l.to + "/")),
    ),
  );
}
