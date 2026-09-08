import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import { initFirebaseAdmin } from "./firebase.js";
import cors from "./middleware/cors.js";
import errorHandler from "./middleware/errorHandler.js";
import newsRouter from "./routes/news.js";
import jobsRouter from "./routes/jobs.js";
import tourismRouter from "./routes/tourism.js";
import navigatorRouter from "./routes/navigator.js";
import chatRouter from "./routes/chat.js";
import feedbackRouter from "./routes/feedback.js";
import refreshRouter from "./routes/refresh.js";
import { startDailyRefreshScheduler } from "./services/dailyRefreshService.js";

let firebaseApp = null;
try {
  firebaseApp = initFirebaseAdmin();
} catch (err) {
  console.error("[boot] Firebase init error:", err.message);
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sokcho-platform-server",
    firebase: firebaseApp ? "connected" : "not_configured",
    env: process.env.VERCEL ? "vercel" : "node",
  });
});

app.use("/api/news", newsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/tourism", tourismRouter);
app.use("/api/navigator", navigatorRouter);
app.use("/api/chat", chatRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/refresh", refreshRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Local / long-running Node only. On Vercel, the platform imports `app` as a serverless handler.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startDailyRefreshScheduler();
  });
}

export default app;
