import dns from "dns";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Prefer IPv4 — avoids hang issues on some Windows networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older Node versions */
}

const PLACEHOLDER_VALUES = new Set([
  "",
  "your_key_here",
  "your_project_id",
  "your_service_account_email",
  "your_private_key",
  "your_key",
  "your_id",
]);

function isConfiguredValue(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (PLACEHOLDER_VALUES.has(trimmed)) return false;
  if (trimmed.startsWith("your_")) return false;
  return true;
}

function getPrivateKey() {
  let raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!isConfiguredValue(raw)) return undefined;
  raw = raw.trim();
  // Vercel / dotenv often store the value wrapped in quotes
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1);
  }
  return raw.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
}

/**
 * Local Windows antivirus/proxy SSL inspection can break Node TLS.
 * Only enable for local development — never in production.
 */
function applyLocalTlsWorkaround() {
  if (process.env.ALLOW_INSECURE_TLS === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[firebase] ALLOW_INSECURE_TLS=true — TLS verification disabled (local only)"
      );
    }
  }
}

let app = null;
let firestore = null;

export function initFirebaseAdmin() {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (
    !isConfiguredValue(projectId) ||
    !isConfiguredValue(clientEmail) ||
    !privateKey
  ) {
    console.warn(
      "[firebase] Admin SDK not initialized — set real FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env"
    );
    return null;
  }

  applyLocalTlsWorkaround();

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (err) {
    console.error(
      "[firebase] Admin SDK init failed — check FIREBASE_PRIVATE_KEY format (use \\n for newlines, no surrounding quotes in Vercel):",
      err.message
    );
    app = null;
    return null;
  }

  return app;
}

export function getDb() {
  if (!app) {
    const initialized = initFirebaseAdmin();
    if (!initialized) {
      throw new Error(
        "Firebase Admin is not configured. Check your .env values."
      );
    }
  }

  if (!firestore) {
    firestore = getFirestore(app);
    // REST avoids gRPC hangs behind some Windows/antivirus networks
    firestore.settings({ preferRest: true, ignoreUndefinedProperties: true });
  }

  return firestore;
}

export const db = {
  collection(...args) {
    return getDb().collection(...args);
  },
};

export default { initFirebaseAdmin, getDb, db };
