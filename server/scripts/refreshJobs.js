import dotenv from "dotenv";
dotenv.config({ path: "e:/Smart Computer Project/sokcho-platform/.env", override: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { refreshJobsForToday } from "../services/jobsService.js";

const result = await refreshJobsForToday();
const items = result.items || [];
const bySource = items.reduce((acc, j) => {
  acc[j.source] = (acc[j.source] || 0) + 1;
  return acc;
}, {});
console.log("TOTAL", items.length);
console.log("BY SOURCE", bySource);
console.log("Karrot samples:");
items.filter((j) => j.source === "Karrot").slice(0, 8).forEach((j) => {
  console.log("-", j.title.slice(0, 50), "|", j.location);
});
