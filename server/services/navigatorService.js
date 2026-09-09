import { getCached, setCached } from "./firebaseService.js";
import { getDb } from "../firebase.js";
import { fetchPageHtml, hasBrightDataKey } from "./brightDataService.js";
import {
  NAVIGATOR_SECTIONS,
  getStaticNavigatorSection,
} from "../data/navigatorContent.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheAgeMs(cachedAt) {
  if (!cachedAt) return Number.POSITIVE_INFINITY;
  const date = cachedAt?.toDate?.() || new Date(cachedAt);
  const ms = date?.getTime?.();
  return Number.isFinite(ms) ? Date.now() - ms : Number.POSITIVE_INFINITY;
}

const LIVE_SOURCES = [
  {
    section: "campus",
    url: "https://www.kduniv.ac.kr/eng/",
    label: "KDU English site",
  },
  {
    section: "campus",
    url: "https://www.kduniv.ac.kr/",
    label: "KDU main site",
  },
  {
    section: "visa",
    url: "https://www.hikorea.go.kr/pt/main_en.pt",
    label: "Hi Korea",
  },
];

function extractPhones(html = "") {
  return [
    ...new Set(
      [...html.matchAll(/0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g)].map((m) =>
        m[0].replace(/\s+/g, "-")
      )
    ),
  ]
    .filter((p) => /033-|02-|031-/.test(p) || p.startsWith("033"))
    .slice(0, 6);
}

function extractTitle(html = "") {
  return (
    (html.match(/<title[^>]*>([^<]*)/i) || [])[1]?.replace(/\s+/g, " ").trim() ||
    ""
  ).slice(0, 120);
}

async function enrichFromBrightData() {
  if (!hasBrightDataKey()) return {};

  const notesBySection = {};

  await Promise.all(
    LIVE_SOURCES.map(async (source) => {
      try {
        const html = await fetchPageHtml(source.url);
        if (!html || html.length < 500) return;
        const title = extractTitle(html);
        const phones = extractPhones(html);
        const note = {
          title: `Live update — ${source.label}`,
          body: title
            ? `Checked ${source.label}: “${title}”. Confirm details on the official site before you travel or submit documents.`
            : `Checked ${source.label}. Open the official link for the newest notices and forms.`,
          link: source.url,
          phone: phones[0] || "",
          tips: phones.length
            ? [`Numbers seen on page: ${phones.slice(0, 3).join(" · ")}`]
            : ["Always verify hours and requirements on the official portal."],
          source: "brightdata-live",
        };
        if (!notesBySection[source.section]) notesBySection[source.section] = [];
        notesBySection[source.section].push(note);
        console.log(`[navigator] enriched ${source.section} from ${source.label}`);
      } catch (err) {
        console.warn(`[navigator] ${source.label} failed:`, err.message);
      }
    })
  );

  return notesBySection;
}

function mergeSection(section, liveNotes = {}) {
  const base = getStaticNavigatorSection(section);
  const extras = liveNotes[section] || [];
  return {
    ...base,
    section,
    content: [...(base.content || []), ...extras],
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchNavigatorSection(section, options = {}) {
  if (!NAVIGATOR_SECTIONS.includes(section)) {
    throw new Error(`Invalid section: ${section}`);
  }

  const force = options.force === true;

  // READ PATH: serve Firestore (or static) — no Bright Data.
  // WRITE PATH: force/cron may enrich with Bright Data and overwrite.
  if (!force) {
    const cached = await getCached("navigator_content", section);
    if (cached?.content?.length) {
      return cached;
    }
    return mergeSection(section, {});
  }

  let liveNotes = {};
  if (hasBrightDataKey()) {
    try {
      liveNotes = await enrichFromBrightData();
    } catch (err) {
      console.warn("[navigator] live enrich failed:", err.message);
    }
  }

  const packed = mergeSection(section, liveNotes);
  await setCached("navigator_content", section, packed);
  return packed;
}

export async function refreshAllNavigatorSections() {
  const liveNotes = await enrichFromBrightData();
  const results = {};
  for (const section of NAVIGATOR_SECTIONS) {
    const packed = mergeSection(section, liveNotes);
    await setCached("navigator_content", section, packed);
    results[section] = packed.content?.length || 0;
  }
  return results;
}

export async function seedNavigatorContent() {
  const db = getDb();
  const batch = db.batch();
  for (const section of NAVIGATOR_SECTIONS) {
    const packed = mergeSection(section, {});
    batch.set(db.collection("navigator_content").doc(section), packed, {
      merge: true,
    });
  }
  await batch.commit();
  return { seeded: NAVIGATOR_SECTIONS };
}

export { NAVIGATOR_SECTIONS };
