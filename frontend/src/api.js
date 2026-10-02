const configured = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
export const API_URL = configured
  ? configured.endsWith("/api/v1")
    ? configured
    : `${configured}/api/v1`
  : "/api/v1";
const cache = new Map();
const pending = new Map();
const MAX_CACHE_ENTRIES = 200;

function invalidatePaths(paths, includeLocalEvents = false) {
  const matches = (path) =>
    (includeLocalEvents && path.startsWith("/events/local-")) ||
    paths.some((prefix) =>
      path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}/`),
    );
  for (const [key, entry] of cache) if (matches(entry.path)) cache.delete(key);
  for (const [key, entry] of pending) if (matches(entry.path)) pending.delete(key);
}

function invalidateMutation(path) {
  const root = path.split("?")[0].split("/")[1];
  const related = {
    workouts: ["/workouts", "/goals", "/recommendations"],
    users: ["/users", "/auth/me", "/recommendations"],
    goals: ["/goals", "/recommendations"],
    community: ["/community"],
    clubs: ["/clubs", "/sessions", "/recommendations"],
    sessions: ["/sessions", "/clubs", "/recommendations"],
  };
  if (related[root])
    invalidatePaths(related[root], root === "sessions" || root === "clubs");
}

export async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    path.startsWith("/places") ? 45000 : 35000,
  );
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data =
      response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      let message =
        data?.detail || "The request could not be completed. Please try again.";
      if (Array.isArray(message))
        message = message
          .map((e) => `${e.loc?.slice(1).join(" ") || "Value"}: ${e.msg}`)
          .join(". ");
      const error = new Error(message);
      error.status = response.status;
      if (
        response.status === 401 &&
        !path.startsWith("/auth/login") &&
        token === localStorage.getItem("token")
      ) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("session-expired"));
      }
      throw error;
    }
    if (data === null && response.status !== 204)
      throw new Error(
        "The server returned an unreadable response. Please try again.",
      );
    if (!["GET", "HEAD"].includes((options.method || "GET").toUpperCase()))
      invalidateMutation(path);
    return data;
  } catch (error) {
    if (error.name === "AbortError" && options.signal?.aborted) throw error;
    if (error.name === "AbortError")
      throw new Error(
        "The provider is taking too long. Please try again in a moment.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Unable to connect. Check your connection and try again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}

export function cached(path, ttl = 60000) {
  const key = `${localStorage.getItem("token") || "public"}:${path}`;
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires && Date.now() - hit.time < ttl)
    return Promise.resolve(hit.data);
  cache.delete(key);
  if (pending.has(key)) return pending.get(key).promise;
  const entry = { path };
  const promise = request(path)
    .then((data) => {
      // Invalidated requests may finish, but must never repopulate the cache.
      if (pending.get(key) === entry) {
        const now = Date.now();
        for (const [storedKey, stored] of cache)
          if (stored.expires <= now) cache.delete(storedKey);
        cache.set(key, { path, time: now, expires: now + ttl, data });
        while (cache.size > MAX_CACHE_ENTRIES)
          cache.delete(cache.keys().next().value);
      }
      return data;
    })
    .finally(() => {
      if (pending.get(key) === entry) pending.delete(key);
    });
  entry.promise = promise;
  pending.set(key, entry);
  return promise;
}
export function clearCache() {
  cache.clear();
  pending.clear();
}
export const login = (username, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
export const register = (username, email, password) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
export const getMe = () => request("/auth/me");
export const getProfile = () => cached("/users/me", 30000);
export const updateProfile = (payload) =>
  request("/users/me", { method: "PUT", body: JSON.stringify(payload) });
export const updateInterests = (interests) =>
  request("/users/me/interests", {
    method: "POST",
    body: JSON.stringify(interests.map((name) => ({ name }))),
  });
export const getEvents = async (
  query = "",
  lat = null,
  lon = null,
  extra = {},
) => {
  const params = new URLSearchParams({
    q: query,
    limit: "200",
    ...(extra.sport ? { sport: extra.sport } : {}),
  });
  const first = await cached(`/events?${params}`);
  const events = [...first.events];
  // Bound concurrency so large calendars do not form a request waterfall or
  // overwhelm the API. Preserve page order and the complete-list contract.
  const pageCount = Math.ceil(first.total / 200);
  for (let start = 2; start <= pageCount; start += 3) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(3, pageCount - start + 1) }, (_, index) => {
        const pageParams = new URLSearchParams(params);
        pageParams.set("page", String(start + index));
        return cached(`/events?${pageParams}`);
      }),
    );
    for (const page of pages) events.push(...page.events);
    if (pages.some((page) => !page.events.length)) break;
  }
  return {
    ...first,
    events: [...new Map(events.map((e) => [e.id, e])).values()],
  };
};
export const getEventHighlights = () => cached("/events?highlights=true");
export const getEventsInViewport = (query = "", bbox = {}) =>
  cached(`/events/viewport?${new URLSearchParams({ q: query, ...bbox })}`);
export const getEventById = (id) => cached(`/events/${encodeURIComponent(id)}`);
export const listSports = () => cached("/sports", 3600000);
export const getSportsEvents = (sport = "bundesliga") =>
  cached(`/sports/${encodeURIComponent(sport)}`);
export const getStandings = (sport = "bundesliga") =>
  cached(`/sports/${encodeURIComponent(sport)}/standings`, 300000);
export const getLeaderboards = getStandings;
export const searchTeams = (query) =>
  cached(`/sports/teams/search?q=${encodeURIComponent(query)}`);
export const teamUpcomingEvents = (id) =>
  cached(`/sports/teams/${encodeURIComponent(id)}/events`);
export const getStreams = () => cached("/streams");
export const getBackendWeather = (lat, lon, hourly = true, hours = 12) =>
  cached(
    `/weather?lat=${lat}&lon=${lon}&hourly=${hourly}&hours=${hours}`,
    600000,
  );
export const getWeather = getBackendWeather;
export const searchLocations = (query) =>
  cached(`/locations?q=${encodeURIComponent(query)}`, 3600000);
export const getPlaces = (lat, lon, radius = 1500) =>
  cached(
    `/places?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}&radius=${radius}`,
    3600000,
  );
export const getWorkouts = async () => {
  let workouts = [],
    skip = 0;
  while (true) {
    const page = await cached(`/workouts?limit=200&skip=${skip}`, 15000);
    workouts = workouts.concat(page.workouts);
    if (page.workouts.length < 200) return { workouts };
    skip += 200;
  }
};
export const saveWorkout = async (payload) => {
  const result = await request("/workouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  window.dispatchEvent(new Event("workouts-changed"));
  return result;
};
export const deleteWorkout = async (id) => {
  await request(`/workouts/${id}`, { method: "DELETE" });
  window.dispatchEvent(new Event("workouts-changed"));
};
export const getCommunity = async (pages = 1) => {
  let posts = [],
    hasMore = false;
  for (let page = 0; page < pages; page += 1) {
    const data = await cached(`/community?limit=30&skip=${page * 30}`, 15000);
    posts.push(...data.posts);
    hasMore = data.has_more;
    if (!hasMore) break;
  }
  return {
    posts: [...new Map(posts.map((p) => [p.id, p])).values()],
    has_more: hasMore,
  };
};
export const createPost = (payload) =>
  request("/community", { method: "POST", body: JSON.stringify(payload) });
export const likePost = (id) =>
  request(`/community/${id}/like`, { method: "POST" });
export const deletePost = (id) =>
  request(`/community/${id}`, { method: "DELETE" });
export const commentPost = (id, content) =>
  request(`/community/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
export const searchAthletes = (sport, query = "") =>
  cached(`/athletes/${sport}?q=${encodeURIComponent(query)}`);
export const compareAthlete = (payload) =>
  request("/athletes/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const comparePlayer = compareAthlete;

// Participation and planning.
export const getGoals = () =>
  cached(
    `/goals?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")}`,
    30000,
  );
export const createTrainingGoal = (body) =>
  request("/goals", { method: "POST", body: JSON.stringify(body) });
export const deleteTrainingGoal = (id) =>
  request(`/goals/${id}`, { method: "DELETE" });
export const getClubs = (q = "", sport = "") =>
  cached(`/clubs?${new URLSearchParams({ q, ...(sport ? { sport } : {}) })}`, 15000);
export const getClub = (id) => cached(`/clubs/${id}`, 15000);
export const createClub = (body) =>
  request("/clubs", { method: "POST", body: JSON.stringify(body) });
export const toggleClubMembership = (id) =>
  request(`/clubs/${id}/membership`, { method: "POST" });
export const deleteClub = (id) => request(`/clubs/${id}`, { method: "DELETE" });
export const getSessions = (
  city = "",
  sport = "",
  joined = false,
  dates = {},
) =>
  cached(
    `/sessions?${new URLSearchParams({ city, sport, joined, ...dates })}`,
    15000,
  );
export const createSession = (body) =>
  request("/sessions", { method: "POST", body: JSON.stringify(body) });
export const getSession = (id) => cached(`/sessions/${id}`, 15000);
export const rsvpSession = (id) =>
  request(`/sessions/${id}/rsvp`, { method: "POST" });
export const cancelSession = async (id) => {
  const result = await request(`/sessions/${id}`, { method: "DELETE" });
  return result;
};
export const searchLocalEvents = (location, sport = "sports", dates = {}) =>
  cached(
    `/discovery/events?${new URLSearchParams({ city: location.name, country: location.country || "", tz: location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", sport, ...dates, ...(Number.isFinite(location.latitude) && Number.isFinite(location.longitude) ? { lat: location.latitude.toFixed(2), lon: location.longitude.toFixed(2) } : {}) })}`,
    3600000,
  );
export const getWorkout = (id) => cached(`/workouts/${id}`, 15000);
export const updateWorkout = async (id, body) => {
  const result = await request(`/workouts/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return result;
};
export const getWatch = (category = "chess") =>
  cached(`/streams?category=${encodeURIComponent(category)}`);
export const getRecommendations = () => cached("/recommendations", 30000);
export const getAccountExport = () => request("/users/me/export");
export const getTeamProfile = (id) =>
  cached(`/sports/teams/${encodeURIComponent(id)}`);
