import { Router } from "express";
import {
  runDailyRefresh,
  getLastDailyRefresh,
  ensureTodaySnapshot,
} from "../services/dailyRefreshService.js";

const router = Router();

/** Force a full daily snapshot (jobs replace + news/weather/tourism). */
router.post("/daily", async (req, res, next) => {
  try {
    const includeJobs = req.query.jobs !== "false";
    const result = await runDailyRefresh({ includeJobs });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/** Idempotent: refresh only if today's snapshot is missing.
 *  Vercel Cron sends GET — accept both methods.
 */
async function ensureHandler(_req, res, next) {
  try {
    const result = await ensureTodaySnapshot();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

router.post("/ensure", ensureHandler);
router.get("/ensure", ensureHandler);

router.get("/status", async (_req, res, next) => {
  try {
    const last = await getLastDailyRefresh();
    res.json({ last: last || null });
  } catch (err) {
    next(err);
  }
});

export default router;
