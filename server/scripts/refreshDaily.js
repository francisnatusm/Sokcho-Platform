import dotenv from "dotenv";
dotenv.config({ path: "e:/Smart Computer Project/sokcho-platform/.env", override: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { runDailyRefresh } from "../services/dailyRefreshService.js";

const includeJobs = !process.argv.includes("--skip-jobs");
const result = await runDailyRefresh({ includeJobs });
console.log(JSON.stringify(result, null, 2));
