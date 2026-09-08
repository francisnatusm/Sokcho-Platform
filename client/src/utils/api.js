// Shared frontend API helpers — expanded in later phases

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getNews() {
  return request("/api/news").then((data) => {
    if (Array.isArray(data)) {
      return { items: data, count: data.length };
    }
    return {
      items: data?.items || [],
      count: data?.count ?? data?.items?.length ?? 0,
      day: data?.day || null,
    };
  });
}

export function refreshNews() {
  return request("/api/news/refresh", { method: "POST" });
}

export function getWeather() {
  return request("/api/news/weather");
}

export function getJobs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/jobs${query ? `?${query}` : ""}`).then((data) => {
    if (Array.isArray(data)) {
      return { items: data, count: data.length, cachedAt: null, day: null };
    }
    return {
      items: data?.items || [],
      count: data?.count ?? data?.items?.length ?? 0,
      cachedAt: data?.cachedAt || null,
      day: data?.day || null,
      source: data?.source || null,
    };
  });
}

export function refreshJobs() {
  return request("/api/jobs/refresh", { method: "POST" });
}

export function refreshDaily(includeJobs = true) {
  const q = includeJobs ? "" : "?jobs=false";
  return request(`/api/refresh/daily${q}`, { method: "POST" });
}

export function getRefreshStatus() {
  return request("/api/refresh/status");
}

export function getAttractions() {
  return request("/api/tourism/attractions").then((data) => {
    if (Array.isArray(data)) {
      return { items: data, count: data.length };
    }
    return {
      items: data?.items || [],
      count: data?.count ?? data?.items?.length ?? 0,
      byCategory: data?.byCategory || null,
    };
  });
}

export function getVisitorStats(params = {}) {
  const query = new URLSearchParams({
    months: "6",
    ...params,
  }).toString();
  return request(`/api/tourism/stats?${query}`).then((data) => {
    if (Array.isArray(data)) {
      return { items: data, year: null, source: null, note: null };
    }
    return {
      items: data?.items || [],
      year: data?.year || null,
      latestYm: data?.latestYm || null,
      source: data?.source || null,
      note: data?.note || null,
    };
  });
}

export function getNavigatorSection(section, force = false) {
  const q = force ? "?refresh=true" : "";
  return request(`/api/navigator/${section}${q}`);
}

export function refreshNavigator() {
  return request("/api/navigator/refresh", { method: "POST" });
}

export function sendChat(messages) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export function submitFeedback(payload) {
  return request("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
