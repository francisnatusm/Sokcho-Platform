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
 * Full daily snapshot refresh:
 * - Jobs: re-scrape and REPLACE today's list (gone from boards = removed)
 * - News / weather / tourism: force fresh fetch and overwrite cache
 * - Navigator: re-seed guides + optional Bright Data live notes
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
    result.weather = { ok: true, temp: weather?.temp };
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

/**
 * Ensure today's snapshot exists / is a real daily refresh.
 * Safe to call from Vercel Cron (GET /api/refresh/ensure).
 */
export async function ensureTodaySnapshot() {
  const day = kstToday();
  const jobsCache = await getCached("jobs_cache", `sokcho-${day}`);
  const meta = await getLastDailyRefresh();

  const hasRealJobs =
    Boolean(jobsCache?.items?.length) &&
    jobsCache.note !== "vercel-fast-seed" &&
    Number(jobsCache.scrapedCount || 0) > 0;

  if (hasRealJobs && meta?.day === day) {
    return { skipped: true, day, reason: "already_refreshed_today" };
  }

  // On Vercel cron (60s limit): scrape jobs first (lite), then refresh
  // news/weather/tourism/navigator without another jobs scrape.
  if (process.env.VERCEL && !hasRealJobs) {
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
    return { skipped: false, day, vercelSplit: true, jobs: jobsResult, ...light };
  }

  if (hasRealJobs) {
    const light = await runDailyRefresh({ includeJobs: false });
    return { skipped: false, day, light: true, ...light };
  }

  return runDailyRefresh({ includeJobs: true });
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
