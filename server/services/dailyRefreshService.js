import { getCached, setCached } from "./firebaseService.js";
import { refreshJobsForToday } from "./jobsService.js";
import { fetchSokchoNews } from "./newsService.js";
import { fetchSokchoWeather } from "./weatherService.js";
import { fetchAttractions, fetchVisitorStats } from "./tourismService.js";
import { refreshAllNavigatorSections } from "./navigatorService.js";

const META_DOC = "last_daily_refresh";

function kstToday() {
  // Asia/Seoul calendar date (UTC+9)
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

/**
 * Full daily snapshot refresh (WRITE path):
 * - Jobs / news / weather / tourism / navigator: fetch live data and OVERWRITE Firestore
 * - Platform GET routes only READ that cache (see each *Service.js)
 */
export async function runDailyRefresh({ includeJobs = true } = {}) {
  const day = kstToday();
  const startedAt = new Date().toISOString();
  const result = {
    day,
    startedAt,
    jobs: null,
    news: null,
    weather: null,
    tourism: null,
    navigator: null,
  };

  console.log(`[daily-refresh] starting for ${day}…`);

  if (includeJobs) {
    try {
      const jobs = await refreshJobsForToday();
      result.jobs = {
        ok: true,
        count: jobs.items?.length || 0,
        source: jobs.source,
      };
    } catch (err) {
      console.error("[daily-refresh] jobs failed:", err.message);
      result.jobs = { ok: false, error: err.message };
    }
  }

  try {
    const news = await fetchSokchoNews({ force: true });
    result.news = { ok: true, count: news?.length || 0 };
  } catch (err) {
    console.error("[daily-refresh] news failed:", err.message);
    result.news = { ok: false, error: err.message };
  }

  try {
    const weather = await fetchSokchoWeather({ force: true });
    result.weather = { ok: true, temp: weather?.temp, day: weather?.day || day };
  } catch (err) {
    console.error("[daily-refresh] weather failed:", err.message);
    result.weather = { ok: false, error: err.message };
  }

  try {
    const attractions = await fetchAttractions({ force: true });
    result.tourism = { ok: true, count: attractions?.length || 0 };
  } catch (err) {
    console.error("[daily-refresh] tourism failed:", err.message);
    result.tourism = { ok: false, error: err.message };
  }

  try {
    const visitors = await fetchVisitorStats({ force: true, months: 6 });
    result.visitors = {
      ok: true,
      count: visitors?.all?.length || visitors?.items?.length || 0,
      latestYm: visitors?.latestYm || null,
    };
  } catch (err) {
    console.error("[daily-refresh] visitors failed:", err.message);
    result.visitors = { ok: false, error: err.message };
  }

  try {
    const counts = await refreshAllNavigatorSections();
    result.navigator = { ok: true, counts };
  } catch (err) {
    console.error("[daily-refresh] navigator failed:", err.message);
    result.navigator = { ok: false, error: err.message };
  }

  const finishedAt = new Date().toISOString();
  await setCached("system_cache", META_DOC, {
    day,
    startedAt,
    finishedAt,
    result,
  });

  console.log(`[daily-refresh] done`, result);
  return { ...result, finishedAt };
}

export async function getLastDailyRefresh() {
  return getCached("system_cache", META_DOC);
}

/** Presentation / ops checklist: is each module fresh for Korea today? */
export async function getPlatformReadiness() {
  const day = kstToday();
  const [jobsCache, newsCache, weatherCache, tourismCache, meta] =
    await Promise.all([
      getCached("jobs_cache", `sokcho-${day}`),
      getCached("news_cache", `sokcho-${day}`),
      getCached("weather_cache", "sokcho"),
      getCached("tourism_cache", "places"),
      getLastDailyRefresh(),
    ]);

  const jobsOk =
    Boolean(jobsCache?.items?.length) &&
    jobsCache.note !== "vercel-fast-seed" &&
    Number(jobsCache.scrapedCount || jobsCache.items?.length || 0) > 0;

  const newsOk = Boolean(newsCache?.items?.length);

  const weatherOk =
    weatherCache?.temp != null &&
    String(weatherCache.day || "") === day &&
    (!weatherCache.forecast?.[0]?.date ||
      String(weatherCache.forecast[0].date) >= day);

  const tourismOk =
    Boolean(tourismCache?.items?.length) &&
    (!tourismCache.day || String(tourismCache.day) === day);

  const metaOk = meta?.day === day;

  const modules = {
    jobs: {
      ok: jobsOk,
      count: jobsCache?.items?.length || 0,
      day: jobsCache?.day || (jobsOk ? day : null),
    },
    news: {
      ok: newsOk,
      count: newsCache?.items?.length || 0,
      day: newsCache?.day || (newsOk ? day : null),
    },
    weather: {
      ok: weatherOk,
      temp: weatherCache?.temp ?? null,
      day: weatherCache?.day || null,
      label: weatherCache?.updatedLabel || null,
      forecast0: weatherCache?.forecast?.[0]?.date || null,
    },
    tourism: {
      ok: tourismOk,
      count: tourismCache?.items?.length || tourismCache?.count || 0,
      day: tourismCache?.day || null,
    },
    meta: {
      ok: metaOk,
      day: meta?.day || null,
      finishedAt: meta?.finishedAt || null,
    },
  };

  const ready = Object.values(modules).every((m) => m.ok);

  return {
    day,
    ready,
    modules,
    tip: ready
      ? "Platform looks fresh for today (KST)."
      : "One or more modules are behind today — call /api/refresh/ensure or wait for daily cron.",
  };
}

/**
 * Ensure today's snapshot exists for jobs + news + weather + tourism.
 * Vercel Cron sends GET /api/refresh/ensure once/twice daily.
 */
export async function ensureTodaySnapshot() {
  const day = kstToday();
  const readiness = await getPlatformReadiness();

  if (readiness.ready) {
    return {
      skipped: true,
      day,
      reason: "already_refreshed_today",
      readiness,
    };
  }

  const needsJobs = !readiness.modules.jobs.ok;
  const needsLight =
    !readiness.modules.news.ok ||
    !readiness.modules.weather.ok ||
    !readiness.modules.tourism.ok ||
    !readiness.modules.meta.ok;

  // On Vercel (60s limit): jobs first when missing, then light modules.
  if (process.env.VERCEL && needsJobs) {
    let jobsResult = null;
    try {
      const jobs = await refreshJobsForToday();
      jobsResult = {
        ok: true,
        count: jobs.items?.length || 0,
        source: jobs.source,
      };
    } catch (err) {
      console.error("[daily-refresh] vercel jobs-first failed:", err.message);
      jobsResult = { ok: false, error: err.message };
    }
    const light = await runDailyRefresh({ includeJobs: false });
    return {
      skipped: false,
      day,
      vercelSplit: true,
      jobs: jobsResult,
      readinessBefore: readiness,
      ...light,
    };
  }

  if (needsJobs) {
    return {
      skipped: false,
      day,
      readinessBefore: readiness,
      ...(await runDailyRefresh({ includeJobs: true })),
    };
  }

  if (needsLight) {
    return {
      skipped: false,
      day,
      light: true,
      readinessBefore: readiness,
      ...(await runDailyRefresh({ includeJobs: false })),
    };
  }

  return {
    skipped: true,
    day,
    reason: "nothing_to_do",
    readiness,
  };
}

let schedulerStarted = false;

export function startDailyRefreshScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Boot: fill today's snapshot if empty (don't block listen)
  setTimeout(() => {
    ensureTodaySnapshot().catch((err) =>
      console.warn("[daily-refresh] boot ensure failed:", err.message)
    );
  }, 5000);

  // Every hour: if KST date rolled over, refresh everything
  const HOUR = 60 * 60 * 1000;
  setInterval(() => {
    ensureTodaySnapshot().catch((err) =>
      console.warn("[daily-refresh] hourly ensure failed:", err.message)
    );
  }, HOUR);

  console.log("[daily-refresh] scheduler armed (boot + hourly KST day check)");
}
