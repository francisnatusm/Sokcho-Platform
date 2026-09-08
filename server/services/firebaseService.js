import { getDb } from "../firebase.js";
import { getStaticNavigatorSection } from "../data/navigatorContent.js";

export async function getCached(collection, docId) {
  try {
    const snap = await getDb().collection(collection).doc(docId).get();
    if (!snap.exists) return null;
    return snap.data();
  } catch {
    return null;
  }
}

export async function setCached(collection, docId, data) {
  try {
    await getDb()
      .collection(collection)
      .doc(docId)
      .set({
        ...data,
        cachedAt: new Date(),
      });
    return true;
  } catch {
    return false;
  }
}

/** Delete jobs_cache docs older than keepDays (KST calendar days). */
export async function pruneOldCaches(collection, { keepDays = 3, prefix = "" } = {}) {
  try {
    const db = getDb();
    const snap = await db.collection(collection).get();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);
    const cutoffKey = cutoff.toISOString().slice(0, 10);

    const deletions = [];
    snap.forEach((doc) => {
      const id = doc.id;
      if (prefix && !id.startsWith(prefix)) return;
      // ids like sokcho-2026-09-05
      const day = (doc.data()?.day || id.replace(/^sokcho-/, "")).slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day < cutoffKey) {
        deletions.push(doc.ref.delete());
      }
    });
    await Promise.all(deletions);
    return deletions.length;
  } catch (err) {
    console.warn("[cache] prune failed:", err.message);
    return 0;
  }
}

export async function saveFeedback(payload) {
  const docRef = await getDb().collection("feedback").add({
    ...payload,
    timestamp: new Date(),
    exportedReady: true,
  });
  return docRef.id;
}

export async function getNavigatorContent(section) {
  try {
    const snap = await getDb().collection("navigator_content").doc(section).get();
    if (snap.exists && snap.data()?.content?.length) return snap.data();
  } catch {
    /* fall through */
  }
  return getStaticNavigatorSection(section);
}

export async function seedNavigatorContent() {
  const { seedNavigatorContent: seed } = await import("./navigatorService.js");
  return seed();
}
