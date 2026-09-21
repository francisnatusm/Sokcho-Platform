import Anthropic from "@anthropic-ai/sdk";
import { fetchSokchoWeather } from "./weatherService.js";
import { fetchSokchoNews } from "./newsService.js";
import { fetchJobs } from "./jobsService.js";
import { fetchAttractions } from "./tourismService.js";
import { getStaticNavigatorSection } from "../data/navigatorContent.js";

const BASE_PROMPT = `You are Sokcho Assistant for Sokcho Civic Hub.
You help busy Sokcho residents get local information quickly without browsing every menu.

You receive a LIVE PLATFORM SNAPSHOT plus optional TARGETED LOOKUP results from the same platform caches.
Answer directly from that platform data whenever possible (weather, news, jobs, places, city guide).
Do not say you lack real-time data if the snapshot already includes it.

CRITICAL DATE RULES:
- The snapshot includes TODAY's exact calendar date and weekday in Asia/Seoul (KST).
- Always use that TODAY line for "what day/date is it?" questions.
- Never guess today's weekday from forecast day labels (Mon/Tue/Wed...). Those are forecast rows, not proof of today's weekday.

ANSWER STYLE:
- Be concise, friendly, and practical. Prefer short bullet lists.
- If TARGETED LOOKUP is present, prioritize it for the user's question.
- Give concrete numbers/names from the snapshot when available.
- Opportunities lists live scraped local jobs only (Part-time / Full-time) — never invent internships, scholarships, or fake listings.
- If something is missing, say so briefly and link the matching page:
  City Pulse (/city-pulse), Opportunities (/opportunities), Tourism Map (/tourism-map), City Guide (/navigator).
- Always reply in the same language the user writes in (English or Korean).
- Never invent official deadlines, visa rules, or fees — use guide tips or direct users to Hi Korea / ISO.`;

function kstNowInfo() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "long",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { date, weekday, time };
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_key_here" || apiKey.startsWith("your_")) {
    return null;
  }
  return new Anthropic({ apiKey });
}

function safe(value, fallback = "n/a") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function latestUserText(messages = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user" && messages[i]?.content) {
      return String(messages[i].content);
    }
  }
  return "";
}

/** Lightweight intent tags from the latest user question (EN/KR keywords). */
function detectLookupNeeds(userText = "") {
  const q = userText.toLowerCase();
  const needs = {
    weather: false,
    news: false,
    jobs: false,
    places: false,
    guide: false,
    placeCategory: null,
    jobQuery: null,
    newsQuery: null,
    guideSection: null,
  };

  if (
    /weather|온도|날씨|기온|forecast|비\b|눈\b|습도|바람/.test(q) ||
    /what day|what date|오늘\s*(무슨\s*)?(요일|날짜)|며칠/.test(q)
  ) {
    needs.weather = true;
  }
  if (/news|headline|뉴스|기사|소식|today.*(happen|event)|오늘.*(일|소식)/.test(q)) {
    needs.news = true;
  }
  if (/job|jobs|work|hiring|아르바이트|채용|일자리|구인|part[-\s]?time|full[-\s]?time/.test(q)) {
    needs.jobs = true;
  }
  if (
    /hotel|motel|숙소|호텔|펜션|guesthouse|게스트/.test(q)
  ) {
    needs.places = true;
    needs.placeCategory = "hotel";
  } else if (/restaurant|food|eat|식당|맛집|카페|cafe|coffee/.test(q)) {
    needs.places = true;
    needs.placeCategory = /cafe|coffee|카페/.test(q) ? "restaurant" : "restaurant";
  } else if (/hospital|병원|clinic|의료/.test(q)) {
    needs.places = true;
    needs.placeCategory = "hospital";
  } else if (/bank|atm|은행/.test(q)) {
    needs.places = true;
    needs.placeCategory = "bank";
  } else if (/city hall|government|시청|관공서|민원/.test(q)) {
    needs.places = true;
    needs.placeCategory = "government";
  } else if (/attraction|tourist|관광|설악|해변|beach|place|places|지도|map|where.*(go|visit)/.test(q)) {
    needs.places = true;
    needs.placeCategory = /attraction|tourist|관광|설악|해변|beach/.test(q)
      ? "attraction"
      : null;
  }

  if (/visa|arc|immigration|비자|출입국|외국인등록/.test(q)) {
    needs.guide = true;
    needs.guideSection = "visa";
  } else if (/campus|kdu|경동|학교|도서관|library/.test(q)) {
    needs.guide = true;
    needs.guideSection = "campus";
  } else if (/kiip|topik|ielts|korean class|한국어|언어/.test(q)) {
    needs.guide = true;
    needs.guideSection = "language";
  } else if (/culture|문화|생활\s*팁|etiquette/.test(q)) {
    needs.guide = true;
    needs.guideSection = "culture";
  } else if (/service|병원|은행|essential|생활\s*서비스/.test(q) && !needs.places) {
    needs.guide = true;
    needs.guideSection = "services";
  }

  // Extract a simple job keyword if present.
  const jobMatch = q.match(
    /\b(cafe|barista|hotel|kitchen|restaurant|mart|편의점|카페|호텔|주방|식당)\b/i
  );
  if (needs.jobs && jobMatch) {
    needs.jobQuery = jobMatch[1];
  }

  const newsMatch = q.match(/(?:about|regarding|뉴스|소식)\s+([a-zA-Z가-힣0-9\s]{2,30})/i);
  if (needs.news && newsMatch) {
    needs.newsQuery = newsMatch[1].trim();
  }

  return needs;
}

async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function summarizeJobs(items = []) {
  const byType = items.reduce((acc, j) => {
    const key = j.type || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const typeLine = Object.entries(byType)
    .map(([k, n]) => `${k}: ${n}`)
    .join(", ");
  return typeLine || "n/a";
}

async function buildTargetedLookup(userText, snapMs) {
  const needs = detectLookupNeeds(userText);
  const parts = [];

  const tasks = [];

  if (needs.jobs) {
    tasks.push(
      (async () => {
        try {
          const jobs = await withTimeout(
            fetchJobs(needs.jobQuery ? { q: needs.jobQuery } : {}),
            snapMs,
            "jobs-lookup"
          );
          const items = jobs?.items || [];
          const lines = items.slice(0, 10).map((j, i) => {
            const title = j.titleEn || j.title;
            return `${i + 1}. ${safe(title)} @ ${safe(j.company)} (${safe(j.type)}) [${safe(j.source)}] ${safe(j.url, "")}`;
          });
          parts.push(
            `TARGETED JOBS${needs.jobQuery ? ` matching "${needs.jobQuery}"` : ""}: ${items.length} found. Top results:\n${lines.join("\n") || "(none)"}`
          );
        } catch (err) {
          parts.push(`TARGETED JOBS: unavailable (${err.message})`);
        }
      })()
    );
  }

  if (needs.places) {
    tasks.push(
      (async () => {
        try {
          const places = await withTimeout(
            fetchAttractions({ force: false }),
            snapMs,
            "places-lookup"
          );
          const list = Array.isArray(places) ? places : places?.items || [];
          const filtered = needs.placeCategory
            ? list.filter(
                (p) =>
                  String(p.category || p.type || "").toLowerCase() ===
                  needs.placeCategory
              )
            : list;
          const lines = filtered.slice(0, 12).map((p, i) => {
            return `${i + 1}. ${safe(p.name || p.title)} (${safe(p.category || p.type)}) ${safe(p.address || p.addr || "")}`;
          });
          parts.push(
            `TARGETED PLACES${needs.placeCategory ? ` category=${needs.placeCategory}` : ""}: ${filtered.length} of ${list.length} pins.\n${lines.join("\n") || "(none)"}`
          );
        } catch (err) {
          parts.push(`TARGETED PLACES: unavailable (${err.message})`);
        }
      })()
    );
  }

  if (needs.news) {
    tasks.push(
      (async () => {
        try {
          const news = await withTimeout(
            fetchSokchoNews({ force: false }),
            snapMs,
            "news-lookup"
          );
          let list = Array.isArray(news) ? news : news?.items || [];
          if (needs.newsQuery) {
            const q = needs.newsQuery.toLowerCase();
            list = list.filter((n) =>
              [n.title, n.summaryEn, n.description, n.source]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q)
            );
          }
          const lines = list.slice(0, 8).map((n, i) => {
            return `${i + 1}. ${safe(n.summaryEn || n.title)}${n.source ? ` (${n.source})` : ""}`;
          });
          parts.push(
            `TARGETED NEWS${needs.newsQuery ? ` about "${needs.newsQuery}"` : ""}: ${list.length} matches.\n${lines.join("\n") || "(none)"}`
          );
        } catch (err) {
          parts.push(`TARGETED NEWS: unavailable (${err.message})`);
        }
      })()
    );
  }

  if (needs.guide && needs.guideSection) {
    try {
      const section = getStaticNavigatorSection(needs.guideSection);
      const lines = (section?.content || []).slice(0, 4).map((c, i) => {
        return `${i + 1}. ${safe(c.title)}: ${safe((c.body || "").slice(0, 220))}`;
      });
      parts.push(
        `TARGETED CITY GUIDE (${needs.guideSection}):\n${lines.join("\n") || "(none)"}`
      );
    } catch (err) {
      parts.push(`TARGETED CITY GUIDE: unavailable (${err.message})`);
    }
  }

  if (needs.weather) {
    parts.push(
      "TARGETED NOTE: For calendar/weather questions, trust the TODAY line and CURRENT WEATHER block in the main snapshot."
    );
  }

  if (tasks.length) {
    await Promise.all(tasks);
  }

  return parts.length ? parts.join("\n\n") : "";
}

async function buildLiveSnapshot(userText = "") {
  const parts = [];
  const SNAP_MS = process.env.VERCEL ? 8000 : 20000;
  const { date, weekday, time } = kstNowInfo();
  parts.push(
    `TODAY (Asia/Seoul): ${weekday}, ${date}, local time ${time}. Use this exact date/weekday for calendar questions.`
  );

  const tasks = [
    (async () => {
      try {
        const w = await withTimeout(
          fetchSokchoWeather({ force: false }),
          SNAP_MS,
          "weather"
        );
        if (w) {
          parts.push(
            `CURRENT WEATHER (Sokcho): ${safe(w.temp)}°C, ${safe(w.condition)}; humidity ${safe(w.humidity)}%; precip ${safe(w.precipitation)}%; wind ${safe(w.wind)}. Source: ${safe(w.source, "platform")}.`
          );
          if (Array.isArray(w.forecast) && w.forecast.length) {
            const days = w.forecast
              .slice(0, 5)
              .map(
                (d) =>
                  `${safe(d.date)} (${safe(d.day)}): ${safe(d.high ?? d.max)}°/${safe(d.low ?? d.min)}° ${safe(d.condition)}`
              )
              .join(" | ");
            parts.push(
              `FORECAST ROWS (not the definition of "today"): ${days}`
            );
          }
        }
      } catch (err) {
        parts.push(`WEATHER: unavailable (${err.message})`);
      }
    })(),
    (async () => {
      try {
        const news = await withTimeout(
          fetchSokchoNews({ force: false }),
          SNAP_MS,
          "news"
        );
        const list = Array.isArray(news) ? news : news?.items || [];
        if (list.length) {
          const lines = list.slice(0, 8).map((n, i) => {
            const title = n.summaryEn || n.title || "Untitled";
            const src = n.source ? ` (${n.source})` : "";
            return `${i + 1}. ${title}${src}`;
          });
          parts.push(`NEWS HEADLINES (${list.length} cached):\n${lines.join("\n")}`);
        } else {
          parts.push("NEWS: no cached articles");
        }
      } catch (err) {
        parts.push(`NEWS: unavailable (${err.message})`);
      }
    })(),
    (async () => {
      try {
        const jobs = await withTimeout(fetchJobs({}), SNAP_MS, "jobs");
        const items = jobs?.items || [];
        const sample = items.slice(0, 6).map((j, i) => {
          return `${i + 1}. ${safe(j.titleEn || j.title)} @ ${safe(j.company)} - ${safe(j.location)} [${safe(j.source)}]`;
        });
        parts.push(
          `JOBS: ${items.length} listings in today's Opportunities cache. By type: ${summarizeJobs(items)}. Sample:\n${sample.join("\n") || "(empty)"}`
        );
      } catch (err) {
        parts.push(`JOBS: unavailable (${err.message})`);
      }
    })(),
    (async () => {
      try {
        const places = await withTimeout(
          fetchAttractions({ force: false }),
          SNAP_MS,
          "places"
        );
        const list = Array.isArray(places) ? places : places?.items || [];
        const byCategory = list.reduce((acc, p) => {
          const key = String(p.category || p.type || "other").toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const categoryLine = Object.keys(byCategory).length
          ? Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => `${k}: ${n}`)
              .join(", ")
          : "n/a";
        const sample = list.slice(0, 8).map((p, i) => {
          return `${i + 1}. ${safe(p.name || p.title)} (${safe(p.category || p.type)})`;
        });
        parts.push(
          `PLACES: ${list.length} Tourism Map pins cached. Counts by category: ${categoryLine}. Sample:\n${sample.join("\n") || "(empty)"}`
        );
      } catch (err) {
        parts.push(`PLACES: unavailable (${err.message})`);
      }
    })(),
  ];

  await Promise.all(tasks);

  try {
    const visa = getStaticNavigatorSection("visa");
    const lang = getStaticNavigatorSection("language");
    const campus = getStaticNavigatorSection("campus");
    const pick = (section, n = 2) =>
      (section.content || [])
        .slice(0, n)
        .map((c) => `- ${c.title}: ${(c.body || "").slice(0, 160)}...`)
        .join("\n");
    parts.push(
      `CITY GUIDE SHORTCUTS:\nVisa:\n${pick(visa)}\nCampus:\n${pick(campus)}\nLanguage (KIIP/TOPIK/IELTS):\n${pick(lang, 3)}`
    );
  } catch {
    /* optional */
  }

  if (userText.trim()) {
    const targeted = await buildTargetedLookup(userText, SNAP_MS);
    if (targeted) {
      parts.push(`=== TARGETED LOOKUP FOR THIS QUESTION ===\n${targeted}`);
    }
  }

  parts.push(
    `PLATFORM LINKS: /city-pulse · /opportunities · /tourism-map · /navigator`
  );

  return parts.join("\n\n");
}

export async function getChatReply(messages) {
  const client = getClient();
  if (!client) {
    throw Object.assign(
      new Error("Claude API is not configured. Set ANTHROPIC_API_KEY in .env"),
      { status: 503 }
    );
  }

  const userText = latestUserText(messages);
  const snapshot = await buildLiveSnapshot(userText);
  const system = `${BASE_PROMPT}\n\n=== LIVE PLATFORM SNAPSHOT (updated from platform caches) ===\n${snapshot}\n=== END SNAPSHOT ===`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages,
  });

  return response.content[0].text;
}

/**
 * Translate Korean job titles to short English phrases.
 * @param {string[]} titles
 * @returns {Promise<Array<[string, string]>>} [original, english] pairs
 */
export async function translateJobTitlesBatch(titles = []) {
  const client = getClient();
  if (!client || !titles.length) return [];

  const list = titles
    .slice(0, 50)
    .map((t, i) => `${i + 1}. ${String(t).slice(0, 120)}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Translate these Korean job listing titles into short natural English (max ~12 words each).
Keep meaning (role, place, pay hint, foreigners OK/not OK).
Return ONLY a JSON array of objects: [{"i":1,"en":"..."}] with the same numbering.

Titles:
${list}`,
      },
    ],
  });

  const text = response.content[0]?.text || "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const arr = JSON.parse(jsonMatch[0]);
    return arr
      .map((row) => {
        const idx = Number(row.i) - 1;
        const en = String(row.en || "").trim();
        if (!Number.isFinite(idx) || idx < 0 || idx >= titles.length || !en) {
          return null;
        }
        return [titles[idx], en];
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function summarizeNewsArticle(koreanText) {
  const client = getClient();
  if (!client) {
    throw Object.assign(
      new Error("Claude API is not configured. Set ANTHROPIC_API_KEY in .env"),
      { status: 503 }
    );
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `Summarize this Korean news article in 2 sentences in English. Be factual and concise:\n\n${koreanText}`,
      },
    ],
  });

  return response.content[0].text;
}
