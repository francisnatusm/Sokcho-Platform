/**
 * Vercel serverless entry — re-exports the Express app.
 * Routes: /api/* → this function (see vercel.json rewrites).
 * Root package.json must list server runtime deps so Vercel can bundle them.
 */
export { default } from "../server/index.js";
