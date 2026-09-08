/**
 * Vercel serverless entry — re-exports the Express app.
 * Routes: /api/* → this function (see vercel.json rewrites).
 */
export { default } from "../server/index.js";
