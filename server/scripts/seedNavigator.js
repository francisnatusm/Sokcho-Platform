/**
 * Seed Firestore navigator_content collection.
 * Run: npm run seed:navigator  (from server/)
 */
import dotenv from "dotenv";
dotenv.config({ path: "e:/Smart Computer Project/sokcho-platform/.env", override: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { initFirebaseAdmin } from "../firebase.js";
import { seedNavigatorContent, refreshAllNavigatorSections } from "../services/navigatorService.js";

initFirebaseAdmin();

const withLive = process.argv.includes("--live");

if (withLive) {
  const counts = await refreshAllNavigatorSections();
  console.log("Seeded + Bright Data live notes:", counts);
} else {
  const result = await seedNavigatorContent();
  console.log("Seeded navigator sections:", result.seeded.join(", "));
}

process.exit(0);
