import { Router } from "express";
import {
  fetchNavigatorSection,
  refreshAllNavigatorSections,
  NAVIGATOR_SECTIONS,
} from "../services/navigatorService.js";

const router = Router();

router.get("/:section", async (req, res, next) => {
  try {
    const { section } = req.params;
    if (!NAVIGATOR_SECTIONS.includes(section)) {
      return res.status(400).json({
        error: `Invalid section. Use one of: ${NAVIGATOR_SECTIONS.join(", ")}`,
      });
    }
    const force = req.query.refresh === "true";
    const data = await fetchNavigatorSection(section, { force });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (_req, res, next) => {
  try {
    const counts = await refreshAllNavigatorSections();
    res.json({ success: true, counts });
  } catch (err) {
    next(err);
  }
});

export default router;
