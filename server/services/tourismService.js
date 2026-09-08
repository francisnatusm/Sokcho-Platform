import { getCached, setCached } from "./firebaseService.js";
import { fetchPageHtml, hasBrightDataKey } from "./brightDataService.js";

const PLACES_TTL_MS = 24 * 60 * 60 * 1000;

/** Civic / service pins not covered well by tourism API */
const CIVIC_PLACES = [
  {
    name: "Sokcho Medical Center",
    lat: 38.206,
    lng: 128.578,
    category: "hospital",
    description: "General hospital with emergency care. Some English support available.",
    imageUrl: "",
    phone: "033-630-6000",
    hours: "24h emergency",
    address: "Dongmyeong-dong, Sokcho",
    source: "curated",
  },
  {
    name: "Sokcho Donghae Hospital",
    lat: 38.2048,
    lng: 128.5912,
    category: "hospital",
    description: "Local hospital near downtown Sokcho.",
    imageUrl: "",
    phone: "033-630-0100",
    hours: "Weekday clinics · ER available",
    address: "Sokcho-si, Gangwon",
    source: "curated",
  },
  {
    name: "Sokcho City Hall",
    lat: 38.207,
    lng: 128.5918,
    category: "government",
    description: "Main municipal office for resident and visitor services.",
    imageUrl: "",
    phone: "033-639-2114",
    hours: "09:00–18:00 (weekdays)",
    address: "Jungang-ro, Sokcho",
    source: "curated",
  },
  {
    name: "Sokcho Immigration / Foreigner Support Desk",
    lat: 38.2074,
    lng: 128.5924,
    category: "government",
    description: "Foreign resident guidance and municipal support desk.",
    imageUrl: "",
    phone: "033-639-2114",
    hours: "09:00–17:00 (weekdays)",
    address: "Sokcho City Hall area",
    source: "curated",
  },
  {
    name: "KB Kookmin Bank Sokcho",
    lat: 38.2082,
    lng: 128.5925,
    category: "bank",
    description: "Bank branch with foreign-card ATM access.",
    imageUrl: "",
    phone: "033-633-2114",
    hours: "09:00–16:00 (weekdays)",
    address: "Jungang-dong, Sokcho",
    source: "curated",
  },
  {
    name: "Shinhan Bank Sokcho",
    lat: 38.2068,
    lng: 128.5935,
    category: "bank",
    description: "Downtown bank branch and ATM.",
    imageUrl: "",
    phone: "033-635-8000",
    hours: "09:00–16:00 (weekdays)",
    address: "Jungang-dong, Sokcho",
    source: "curated",
  },
  {
    name: "Woori Bank Sokcho",
    lat: 38.2076,
    lng: 128.591,
    category: "bank",
    description: "Bank and ATM near city center.",
    imageUrl: "",
    phone: "033-633-7111",
    hours: "09:00–16:00 (weekdays)",
    address: "Sokcho-si",
    source: "curated",
  },
  {
    name: "Nonghyup Bank Sokcho",
    lat: 38.2055,
    lng: 128.5905,
    category: "bank",
    description: "NH Bank branch commonly used by students and residents.",
    imageUrl: "",
    phone: "033-635-3001",
    hours: "09:00–16:00 (weekdays)",
    address: "Sokcho-si",
    source: "curated",
  },
];

const FALLBACK_PLACES = [
  {
    name: "Seoraksan National Park",
    lat: 38.1195,
    lng: 128.4656,
    category: "attraction",
    description: "Famous mountain park with hiking trails and autumn foliage.",
    imageUrl: "",
    phone: "033-636-7700",
    hours: "Sunrise–Sunset",
    address: "Seoraksan-ro, Sokcho",
    source: "fallback",
  },
  {
    name: "Sokcho Beach",
    lat: 38.2075,
    lng: 128.598,
    category: "attraction",
    description: "Central beach promenade near downtown Sokcho.",
    imageUrl: "",
    phone: "",
    hours: "Always open",
    address: "Joyang-dong, Sokcho",
    source: "fallback",
  },
  {
    name: "Abai Village",
    lat: 38.2045,
    lng: 128.5945,
    category: "restaurant",
    description: "Historic village known for local seafood restaurants.",
    imageUrl: "",
    phone: "",
    hours: "11:00–21:00",
    address: "Cheongho-dong, Sokcho",
    source: "fallback",
  },
  ...CIVIC_PLACES,
];

/**
 * Fallback only if Korea Tourism Data Lab API is unreachable.
 * Prefer live fetchVisitorStats() which pulls through the latest published month.
 */
const VISITOR_STATS_FALLBACK = [
  { month: "Jan", visitorCount: 2674620, year: 2024, ym: "202401" },
  { month: "Feb", visitorCount: 2603251, year: 2024, ym: "202402" },
  { month: "Mar", visitorCount: 2663658, year: 2024, ym: "202403" },
  { month: "Apr", visitorCount: 2446374, year: 2024, ym: "202404" },
  { month: "May", visitorCount: 2759046, year: 2024, ym: "202405" },
  { month: "Jun", visitorCount: 2919385, year: 2024, ym: "202406" },
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SOKCHO_SGG = "51150";
const VISITOR_TTL_MS = 12 * 60 * 60 * 1000; // refresh twice a day

function ymLabel(ym) {
  const y = String(ym).slice(0, 4);
  const m = Number(String(ym).slice(4, 6));
  return `${MONTH_LABELS[m - 1] || m} ${y.slice(2)}`;
}

function mapDatalabRows(list = []) {
  return list
    .filter((row) => row?.BASE_YM && row?.TOU_NUM != null)
    .map((row) => {
      const ym = String(row.BASE_YM);
      const monthIdx = Number(ym.slice(4, 6)) - 1;
      return {
        month: ymLabel(ym),
        monthShort: MONTH_LABELS[monthIdx] || ym.slice(4, 6),
        visitorCount: Math.round(Number(row.TOU_NUM)),
        year: Number(ym.slice(0, 4)),
        ym,
      };
    })
    .sort((a, b) => a.ym.localeCompare(b.ym));
}

async function fetchDatalabVisitorRows(baseYm1, baseYm2) {
  const body = new URLSearchParams({
    qid: "LN_04_01_009",
    SGG_CD: SOKCHO_SGG,
    SGG_NM: "속초시",
    BASE_YM1: baseYm1,
    BASE_YM2: baseYm2,
    srchAreaDate: "1",
    tabDiv: "2",
    dispYn: "Y",
  }).toString();

  const res = await fetch(
    "https://datalab.visitkorea.or.kr/visualize/getTempleteData.do",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://datalab.visitkorea.or.kr/datalab/portal/loc/getAreaDataForm.do?SGG_CD=${SOKCHO_SGG}`,
        Origin: "https://datalab.visitkorea.or.kr",
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`Data Lab HTTP ${res.status}`);
  }
  const data = await res.json();
  const rows = mapDatalabRows(data.list || []);
  if (!rows.length) throw new Error("Data Lab returned empty list");
  return rows;
}

/** Bright Data fallback — GET with query string (Unlocker). */
async function fetchDatalabVisitorRowsViaBrightData(baseYm1, baseYm2) {
  if (!hasBrightDataKey()) return [];
  const qs = new URLSearchParams({
    qid: "LN_04_01_009",
    SGG_CD: SOKCHO_SGG,
    SGG_NM: "속초시",
    BASE_YM1: baseYm1,
    BASE_YM2: baseYm2,
    srchAreaDate: "1",
    tabDiv: "2",
    dispYn: "Y",
  }).toString();
  const text = await fetchPageHtml(
    `https://datalab.visitkorea.or.kr/visualize/getTempleteData.do?${qs}`
  );
  const data = JSON.parse(text);
  return mapDatalabRows(data.list || []);
}

/** KorService2 contentTypeId → map category */
const CONTENT_TYPES = [
  { id: 12, category: "attraction", rows: 80 },
  { id: 14, category: "attraction", rows: 40 },
  { id: 38, category: "attraction", rows: 30 },
  { id: 39, category: "restaurant", rows: 80 },
  { id: 32, category: "hotel", rows: 60 },
];

function hasKtoKey() {
  const key = process.env.KTO_API_KEY || process.env.DATA_GO_KR_API_KEY;
  return key && !key.startsWith("your_");
}

function buildListUrl(serviceKey, contentTypeId, numOfRows) {
  const encodedKey = encodeURIComponent(serviceKey);
  return (
    "https://apis.data.go.kr/B551011/KorService2/areaBasedList2" +
    `?serviceKey=${encodedKey}` +
    `&numOfRows=${numOfRows}&pageNo=1&MobileOS=ETC&MobileApp=SokchoPlatform` +
    `&_type=json&areaCode=32&sigunguCode=5&contentTypeId=${contentTypeId}`
  );
}

function mapKtoItem(item, category) {
  return {
    name: item.title,
    lat: Number(item.mapy),
    lng: Number(item.mapx),
    category,
    description: item.addr1 || item.overview || "",
    imageUrl: item.firstimage || item.firstimage2 || "",
    phone: item.tel || "",
    hours: "",
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    source: "korea-tourism",
  };
}

async function fetchKtoCategory(serviceKey, { id, category, rows }) {
  const response = await fetch(buildListUrl(serviceKey, id, rows));
  const data = await response.json().catch(() => null);
  const authError = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
  if (!response.ok || authError) {
    console.warn(
      `[tourism] type ${id} failed:`,
      authError || `HTTP ${response.status}`
    );
    return [];
  }
  const raw = data?.response?.body?.items?.item || [];
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items
    .filter((item) => item?.mapx && item?.mapy && item?.title)
    .map((item) => mapKtoItem(item, category));
}

/**
 * Overpass (OSM) — hospitals, banks, ATMs, government around Sokcho.
 * Free public API; Bright Data not required.
 */
async function fetchOsmCivicPlaces() {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](38.15,128.50,38.28,128.65);
      node["amenity"="clinic"](38.15,128.50,38.28,128.65);
      node["amenity"="bank"](38.15,128.50,38.28,128.65);
      node["amenity"="atm"](38.15,128.50,38.28,128.65);
      node["amenity"="townhall"](38.15,128.50,38.28,128.65);
      node["office"="government"](38.15,128.50,38.28,128.65);
      way["amenity"="hospital"](38.15,128.50,38.28,128.65);
      way["amenity"="bank"](38.15,128.50,38.28,128.65);
      way["amenity"="townhall"](38.15,128.50,38.28,128.65);
    );
    out center tags 40;
  `;

  const overpassUrl =
    "https://overpass-api.de/api/interpreter?data=" +
    encodeURIComponent(query);

  let data = null;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (response.ok) {
      data = await response.json();
    } else {
      console.warn("[tourism] Overpass", response.status);
    }
  } catch (err) {
    console.warn("[tourism] Overpass direct failed:", err.message);
  }

  // Fallback through Bright Data when local TLS/network blocks Overpass
  if (!data?.elements?.length && hasBrightDataKey()) {
    try {
      const text = await fetchPageHtml(overpassUrl);
      data = JSON.parse(text);
      console.log("[tourism] Overpass via Bright Data", data.elements?.length || 0);
    } catch (err) {
      console.warn("[tourism] Overpass+BD failed:", err.message);
      return [];
    }
  }

  if (!data?.elements?.length) return [];

  return data.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags["name:ko"];
      if (lat == null || lng == null || !name) return null;

      let category = "government";
      if (tags.amenity === "hospital" || tags.amenity === "clinic") {
        category = "hospital";
      } else if (tags.amenity === "bank" || tags.amenity === "atm") {
        category = "bank";
      }

      return {
        name,
        lat: Number(lat),
        lng: Number(lng),
        category,
        description:
          tags.description ||
          tags["addr:full"] ||
          [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") ||
          category,
        imageUrl: "",
        phone: tags.phone || tags["contact:phone"] || "",
        hours: tags.opening_hours || "",
        address:
          tags["addr:full"] ||
          [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
            .filter(Boolean)
            .join(" ") ||
          "Sokcho",
        source: "openstreetmap",
      };
    })
    .filter(Boolean);
}

const NAVER_PLACE_QUERIES = [
  { q: "속초 맛집", category: "restaurant" },
  { q: "속초 카페", category: "restaurant" },
  { q: "속초 호텔", category: "hotel" },
  { q: "속초 펜션", category: "hotel" },
  { q: "속초 관광지", category: "attraction" },
  { q: "속초 병원", category: "hospital" },
  { q: "속초 은행", category: "bank" },
];

function inSokchoArea(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 38.05 &&
    lat <= 38.35 &&
    lng >= 128.4 &&
    lng <= 128.75
  );
}

function parseNaverPlacesHtml(html, category) {
  const found = [];
  const re =
    /"name"\s*:\s*"([^"\\]{2,60})"[\s\S]{0,500}?"x"\s*:\s*"?(12[78]\.\d+)"?[\s\S]{0,120}?"y"\s*:\s*"?(38\.\d+)"?/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const name = match[1]
      .replace(/\\u0026/g, "&")
      .replace(/\\"/g, '"')
      .trim();
    const lng = Number(match[2]);
    const lat = Number(match[3]);
    if (!name || /쿠폰|검색|업체명|알림받기/.test(name)) continue;
    if (!inSokchoArea(lat, lng)) continue;
    found.push({
      name,
      lat,
      lng,
      category,
      description: `Popular local spot in Sokcho (${category}).`,
      imageUrl: "",
      phone: "",
      hours: "",
      address: "Sokcho-si, Gangwon",
      source: "brightdata-naver",
    });
  }
  return found;
}

async function scrapeNaverPlacesViaBrightData() {
  if (!hasBrightDataKey()) return [];

  const batches = await Promise.all(
    NAVER_PLACE_QUERIES.map(async ({ q, category }) => {
      try {
        const url = `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(q)}`;
        const html = await fetchPageHtml(url);
        const places = parseNaverPlacesHtml(html, category);
        console.log(`[tourism] Naver+BD "${q}": ${places.length}`);
        return places;
      } catch (err) {
        console.warn(`[tourism] Naver+BD "${q}" failed:`, err.message);
        return [];
      }
    })
  );

  return batches.flat();
}

function dedupePlaces(places) {
  const seen = new Set();
  const out = [];
  for (const place of places) {
    if (!inSokchoArea(Number(place.lat), Number(place.lng))) continue;
    const key = `${(place.name || "").toLowerCase().replace(/\s+/g, "")}|${Number(
      place.lat
    ).toFixed(4)}|${Number(place.lng).toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out;
}

export async function fetchAttractions(options = {}) {
  const forceRefresh = options.force === true;
  const cacheId = "places";

  if (!forceRefresh) {
    try {
      const cached = await getCached("tourism_cache", cacheId);
      if (
        cached?.items?.length &&
        cached.cachedAt &&
        Date.now() - new Date(cached.cachedAt).getTime() < PLACES_TTL_MS
      ) {
        return cached.items;
      }
      // legacy key
      const legacy = await getCached("tourism_cache", "attractions");
      if (
        legacy?.items?.length &&
        legacy.cachedAt &&
        Date.now() - new Date(legacy.cachedAt).getTime() < PLACES_TTL_MS
      ) {
        return legacy.items;
      }
    } catch {
      /* optional */
    }
  }

  let ktoPlaces = [];
  if (hasKtoKey()) {
    const serviceKey = process.env.KTO_API_KEY || process.env.DATA_GO_KR_API_KEY;
    const batches = await Promise.all(
      CONTENT_TYPES.map((type) => fetchKtoCategory(serviceKey, type))
    );
    ktoPlaces = batches.flat();
    console.log(
      "[tourism] KTO places",
      ktoPlaces.length,
      Object.fromEntries(
        CONTENT_TYPES.map((t) => [
          t.category,
          ktoPlaces.filter((p) => p.category === t.category).length,
        ])
      )
    );
  } else {
    console.warn("[tourism] KTO key missing");
  }

  const [osmPlaces, naverPlaces] = await Promise.all([
    fetchOsmCivicPlaces(),
    scrapeNaverPlacesViaBrightData(),
  ]);
  console.log("[tourism] OSM civic", osmPlaces.length);
  console.log("[tourism] Naver+BD", naverPlaces.length);

  let merged = dedupePlaces([
    ...ktoPlaces,
    ...naverPlaces,
    ...osmPlaces,
    ...CIVIC_PLACES,
  ]);

  if (!merged.length) {
    merged = FALLBACK_PLACES;
  }

  const byCategory = merged.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  await setCached("tourism_cache", cacheId, {
    items: merged,
    byCategory,
    count: merged.length,
  });
  // Keep legacy doc in sync for older callers
  await setCached("tourism_cache", "attractions", { items: merged, byCategory });

  console.log("[tourism] unique=", merged.length, byCategory);
  return merged;
}

export async function fetchVisitorStats(options = {}) {
  const forceRefresh = options.force === true;
  const months = Number(options.months) > 0 ? Number(options.months) : 6;

  if (!forceRefresh) {
    try {
      const cached = await getCached("tourism_cache", "visitor_stats");
      if (
        cached?.all?.length &&
        cached.cachedAt &&
        Date.now() - new Date(cached.cachedAt).getTime() < VISITOR_TTL_MS
      ) {
        const items = cached.all.slice(-months);
        return {
          items,
          all: cached.all,
          year: items[items.length - 1]?.year || null,
          latestYm: cached.latestYm || items[items.length - 1]?.ym || null,
          source: cached.source || "korea-tourism-datalab",
          note: cached.note || "Korea Tourism Data Lab (live)",
        };
      }
    } catch {
      /* optional */
    }
  }

  // Request a wide window; Data Lab returns whatever months are published
  const end = new Date();
  const endYm = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, "0")}`;
  const startYm = "202401";

  let all = [];
  let source = "korea-tourism-datalab";
  try {
    all = await fetchDatalabVisitorRows(startYm, endYm);
    console.log(
      `[tourism] Data Lab visitors ${all[0]?.ym}→${all[all.length - 1]?.ym} (${all.length} months)`
    );
  } catch (err) {
    console.warn("[tourism] Data Lab direct failed:", err.message);
    try {
      all = await fetchDatalabVisitorRowsViaBrightData(startYm, endYm);
      source = "korea-tourism-datalab+brightdata";
      console.log(`[tourism] Data Lab via Bright Data: ${all.length} months`);
    } catch (err2) {
      console.warn("[tourism] Data Lab+BD failed:", err2.message);
      all = VISITOR_STATS_FALLBACK;
      source = "fallback";
    }
  }

  if (!all.length) all = VISITOR_STATS_FALLBACK;

  const latestYm = all[all.length - 1]?.ym || null;
  const note =
    source === "fallback"
      ? "Offline fallback sample"
      : `Korea Tourism Data Lab · live through ${latestYm || "latest"}`;

  await setCached("tourism_cache", "visitor_stats", {
    all,
    latestYm,
    source,
    note,
  });

  const items = all.slice(-months);
  return {
    items,
    all,
    year: items[items.length - 1]?.year || null,
    latestYm,
    source,
    note,
  };
}
