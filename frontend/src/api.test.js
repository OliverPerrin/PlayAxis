import { cached, clearCache, createPost, getCommunity, getEventHighlights, getEvents, getGoals, getProfile, request, saveWorkout } from "./api";
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
beforeEach(() => {
  clearCache();
  localStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => jest.restoreAllMocks());
test("profile requests share a flight and cache but remain isolated between accounts", async () => {
  fetch.mockResolvedValueOnce(response({ id: 1 })).mockResolvedValueOnce(response({ id: 2 }));
  localStorage.setItem("token", "first");
  const [first, duplicate] = await Promise.all([getProfile(), getProfile()]);
  expect(first).toEqual(duplicate);
  await getProfile();
  expect(fetch).toHaveBeenCalledTimes(1);
  localStorage.setItem("token", "second");
  expect(await getProfile()).toEqual({ id: 2 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
test("workout mutation refreshes goals without discarding unrelated provider data", async () => {
  fetch.mockImplementation(async (url) => response(url.includes("goals") ? { goals: [] } : {}));
  await cached("/sports");
  await getGoals();
  await saveWorkout({ duration_sec: 60 });
  await cached("/sports");
  await getGoals();
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/sports"))).toHaveLength(1);
  expect(fetch.mock.calls.filter(([url]) => url.includes("/goals?"))).toHaveLength(2);
});
test("mutation invalidation prevents an older flight from repopulating cached data", async () => {
  const old = deferred();
  fetch.mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(response({ id: 1 }))
    .mockResolvedValueOnce(response({ posts: [{ id: 1 }], has_more: false }));
  const outdated = getCommunity();
  await createPost({ content: "New post" });
  const fresh = await getCommunity();
  old.resolve(response({ posts: [], has_more: false }));
  await outdated;
  expect(await getCommunity()).toEqual(fresh);
  expect(fetch).toHaveBeenCalledTimes(3);
});
test("a delayed 401 from a previous account does not log out the current account", async () => {
  const old = deferred();
  fetch.mockReturnValueOnce(old.promise);
  localStorage.setItem("token", "old");
  const pending = request("/users/me");
  localStorage.setItem("token", "new");
  old.resolve(response({ detail: "Expired" }, 401));
  await expect(pending).rejects.toThrow("Expired");
  expect(localStorage.getItem("token")).toBe("new");
});
test("caller abort signals are honored and retain AbortError semantics", async () => {
  fetch.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  const controller = new AbortController();
  const pending = request("/locations?q=test", { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});
test("event pagination loads at most three remaining pages concurrently and preserves order", async () => {
  const pages = [deferred(), deferred(), deferred()];
  fetch.mockResolvedValueOnce(response({ total: 1000, events: [{ id: 1 }] }))
    .mockReturnValueOnce(pages[0].promise)
    .mockReturnValueOnce(pages[1].promise)
    .mockReturnValueOnce(pages[2].promise)
    .mockResolvedValueOnce(response({ events: [{ id: 5 }] }));
  const all = getEvents();
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  expect(fetch).toHaveBeenCalledTimes(4);
  pages[2].resolve(response({ events: [{ id: 4 }] }));
  pages[0].resolve(response({ events: [{ id: 2 }] }));
  pages[1].resolve(response({ events: [{ id: 3 }] }));
  expect((await all).events.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
  expect(fetch).toHaveBeenCalledTimes(5);
});

test.each(["/sessions/42/rsvp", "/sessions/42", "/clubs/7"])("%s invalidates local event details and preserves provider events", async (path) => {
  fetch.mockResolvedValue(response({ id: "local-42" }));
  await cached("/events/local-42");
  await cached("/events/provider-42");
  await request(path, { method: path.endsWith("rsvp") ? "POST" : "DELETE" });
  await cached("/events/local-42");
  await cached("/events/provider-42");
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/events/local-42"))).toHaveLength(2);
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/events/provider-42"))).toHaveLength(1);
});


test("home highlights use one cached request without fetching the complete event catalogue", async () => {
  const highlights = {
    total: 600,
    events: [{ id: "first", league: "League A" }, { id: "second", league: "League B" }],
  };
  fetch.mockResolvedValue(response(highlights));
  expect(await getEventHighlights()).toEqual(highlights);
  expect(await getEventHighlights()).toEqual(highlights);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toMatch(/\/events\?highlights=true$/);
});
