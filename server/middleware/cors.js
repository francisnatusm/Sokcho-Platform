import cors from "cors";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

function extraOrigins() {
  const raw = process.env.CLIENT_ORIGIN || process.env.CORS_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin / curl / mobile webviews without Origin
  const allowed = [...defaultOrigins, ...extraOrigins()];
  if (allowed.includes(origin)) return true;
  // Vercel preview + production for this project
  if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

const corsMiddleware = cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export default corsMiddleware;
