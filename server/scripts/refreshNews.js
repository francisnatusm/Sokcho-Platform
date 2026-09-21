import dotenv from "dotenv";
dotenv.config({ path: "e:/Smart Computer Project/sokcho-platform/.env", override: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { refreshNewsForToday } from "../services/newsService.js";

const items = await refreshNewsForToday();
console.log("TOTAL", items.length);
items.slice(0, 10).forEach((n, i) => {
  console.log(`${i + 1}. [${n.source}] ${n.title.slice(0, 70)}`);
});
