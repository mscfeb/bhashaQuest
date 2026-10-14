const API_BASE_URL = (
  import.meta.env. API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

// In-memory request deduplication/cache avoids duplicate GETs across pages.
// Cache lives for this browser tab and is invalidated after a submission.
const cache = new Map();
const inFlight = new Map();
const DEFAULT_TTL_MS = 60_000;

async function request(path, options = {}) {
  const token = "";
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("Cannot connect to FastAPI. Check the backend URL and that the server is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  let data;
  try {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new Error("The backend returned an unreadable response.");
  }

  if (!response.ok) {
    const detail = typeof data === "object" && data !== null
      ? data.detail || data.message
      : data;
    throw new Error(typeof detail === "string" ? detail : `Request failed (${response.status}).`);
  }
  return data;
}

function cachedGet(path, ttl = DEFAULT_TTL_MS, { force = false } = {}) {
  const cached = cache.get(path);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }
  if (!force && inFlight.has(path)) return inFlight.get(path);

  const promise = request(path, { cache: force ? "no-store" : "default" })
    .then((data) => {
      if (inFlight.get(path) === promise) {
        cache.set(path, { data, expiresAt: Date.now() + ttl });
      }
      return data;
    })
    .finally(() => {
      if (inFlight.get(path) === promise) inFlight.delete(path);
    });

  inFlight.set(path, promise);
  return promise;
}

export function invalidateApiCache() {
  cache.clear();
  inFlight.clear();
}

export function getTodayChallenge(language = "en", { force = false } = {}) {
  const params = new URLSearchParams({ language });
  const path = `/api/challenges/today?${params}`;
  if (force) cache.delete(path);
  return cachedGet(path, DEFAULT_TTL_MS, { force });
}

export function getTodayProgress(userId, { force = false } = {}) {
  if (!userId) throw new Error("A user ID is required to load progress.");
  const params = new URLSearchParams({ user_id: userId });
  const path = `/api/progress/today?${params}`;
  if (force) cache.delete(path);
  return cachedGet(path, 15_000, { force });
}

export async function submitAudio({ challengeId, language, userId, audio }) {
  if (!challengeId) throw new Error("A challenge ID is required.");
  if (!userId) throw new Error("A user ID is required to submit audio.");
  if (!(audio instanceof Blob) || audio.size === 0) {
    throw new Error("Please record a non-empty audio clip before submitting.");
  }

  const formData = new FormData();
  formData.append("challenge_id", String(challengeId));
  formData.append("language", language);
  formData.append("user_id", userId);
  const extension = audio.type.includes("mp4") ? "m4a" : "webm";
  formData.append("audio", audio, `recording.${extension}`);

  const result = await request("/api/submissions", {
    method: "POST",
    body: formData,
  });
  invalidateApiCache();
  return result;
}

// Add these functions to src/services/api.js.
// Reuse the API_BASE_URL constant already declared in this file.

async function getJson(url, { force = false } = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: force ? "no-store" : "default",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Unable to load data.");
  }

  return response.json();
}

export function getLeaderboard(
  userId,
  period = "weekly",
  { force = false } = {}
) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const params = new URLSearchParams({
    user_id: userId,
    period,
    limit: "10",
  });

  return getJson(
    `${API_BASE_URL}/api/leaderboard?${params.toString()}`,
    { force },
  );
}

export function getProgressHistory(
  userId,
  days = 7,
  { force = false } = {}
) {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const params = new URLSearchParams({
    user_id: userId,
    days: String(days),
  });

  const url = `${API_BASE_URL}/api/progress/history?${params}`;

  return getJson(url, { force });
}