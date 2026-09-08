import { Router } from "express";
import { fetchJobs, refreshJobsForToday } from "../services/jobsService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { items, cachedAt, source, day } = await fetchJobs({
      type: req.query.type || "all",
      english: req.query.english,
      q: req.query.q,
      refresh: req.query.refresh,
    });
    res.json({
      items,
      count: items.length,
      day,
      cachedAt: cachedAt || null,
      source: source || null,
    });
  } catch (err) {
    next(err);
  }
});

// Force a fresh Bright Data scrape + save for today
router.post("/refresh", async (_req, res, next) => {
  try {
    const result = await refreshJobsForToday();
    res.json({
      success: true,
      count: result.items.length,
      source: result.source,
      day: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
