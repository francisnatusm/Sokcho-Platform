/**
 * Quick Firestore connectivity check.
 * Run from server/: npm run test:firebase
 * Requires FIREBASE_* values in ../.env
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { getDb, initFirebaseAdmin } from "../firebase.js";

async function testFirestore() {
  const app = initFirebaseAdmin();
  if (!app) {
    console.error(
      "FAIL: Firebase Admin not configured. Fill FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env"
    );
    process.exit(1);
  }

  try {
    const db = getDb();
    const probe = db.collection("_connection_test").doc("ping");
    await probe.set({
      ok: true,
      testedAt: new Date().toISOString(),
    });
    const snap = await probe.get();
    await probe.delete();

    if (!snap.exists || snap.data()?.ok !== true) {
      console.error("FAIL: Wrote ping doc but could not read it back.");
      process.exit(1);
    }

    console.log("OK: Firestore connection successful.");
    process.exit(0);
  } catch (err) {
    console.error("FAIL: Firestore connection error:", err.message);
    process.exit(1);
  }
}

testFirestore();
