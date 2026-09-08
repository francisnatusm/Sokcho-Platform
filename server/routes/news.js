import { Router } from "express";
import { fetchSokchoNews, refreshNewsForToday } from "../services/newsService.js";
import { fetchSokchoWeather } from "../services/weatherService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const force = req.query.refresh === "true";
    const items = await fetchSokchoNews({ force });
    res.json({
      items,
      count: items.length,
      day: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (_req, res, next) => {
  try {
    const items = await refreshNewsForToday();
    res.json({
      success: true,
      count: items.length,
      items,
      day: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/weather", async (_req, res, next) => {
  try {
    const weather = await fetchSokchoWeather();
    res.json(weather);
  } catch (err) {
    next(err);
  }
});

export default router;
