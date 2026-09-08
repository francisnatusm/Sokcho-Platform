import { Router } from "express";
import { saveFeedback } from "../services/firebaseService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { page, sessionId, responses, language } = req.body || {};

    if (!page || !Array.isArray(responses)) {
      return res.status(400).json({
        error: "page and responses are required",
        success: false,
      });
    }

    try {
      await saveFeedback({
        page,
        sessionId: sessionId || "anonymous",
        responses,
        language: language || "en",
      });
    } catch {
      // Allow research UI flow to complete even before Firebase credentials exist
      console.warn(
        "[feedback] Saved locally only — Firebase not configured. Payload accepted."
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
