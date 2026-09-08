import { Router } from "express";
import { getChatReply } from "../services/claudeService.js";

const router = Router();

// POST /api/chat — Claude civic assistant
router.post("/", async (req, res, next) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "messages must be a non-empty array",
        reply: "",
      });
    }

    const valid = messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );

    if (!valid) {
      return res.status(400).json({
        error: "Each message must have role 'user'|'assistant' and content string",
        reply: "",
      });
    }

    const reply = await getChatReply(messages);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

export default router;
