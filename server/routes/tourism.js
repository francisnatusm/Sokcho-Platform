import { Router } from "express";
import {
  fetchAttractions,
  fetchVisitorStats,
} from "../services/tourismService.js";

const router = Router();

router.get("/attractions", async (req, res, next) => {
  try {
    const force = req.query.refresh === "true";
    const items = await fetchAttractions({ force });
    res.json({
      items,
      count: items.length,
      byCategory: items.reduce((acc, p) => {
        const key = p.category || "attraction";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (_req, res, next) => {
  try {
    const items = await fetchAttractions({ force: true });
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const months = req.query.months || 6;
    const force = req.query.refresh === "true";
    const result = await fetchVisitorStats({ months, force });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
