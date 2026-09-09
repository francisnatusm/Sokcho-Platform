import Anthropic from "@anthropic-ai/sdk";
import { fetchSokchoWeather } from "./weatherService.js";
import { fetchSokchoNews } from "./newsService.js";
import { fetchJobs } from "./jobsService.js";
import { fetchAttractions } from "./tourismService.js";
import { getStaticNavigatorSection } from "../data/navigatorContent.js";

const BASE_PROMPT = `You are Sokcho Assistant for the Sokcho Smart City Intelligence Platform.
You help international students (esp. Kyungdong University / KDU), residents, and tourists.

You receive a LIVE PLATFORM SNAPSHOT below (weather, news, jobs, places, navigator tips).
USE that snapshot when answering questions about today's weather, news, events, jobs, or attractions.
Do not say you lack real-time data if the snapshot already includes it.
If a field is missing, say so briefly and point users to the matching platform section:
- City Pulse → weather & news
- Opportunities → jobs
- Tourism Map → places
- International Navigator → visa, services, campus, culture, language (incl. KIIP / TOPIK / IELTS)

Always reply in the same language the user writes in (English or Korean).
Be concise, friendly, and practical. Prefer short bullet lists.
Never invent official deadlines, visa rules, or fees — use navigator tips or direct users to Hi Korea / ISO.`;

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

async function buildLiveSnapshot() {
  const parts = [];
  const SNAP_MS = process.env.VERCEL ? 8000 : 20000;

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
            `WEATHER (Sokcho): ${safe(w.temp)}°C, ${safe(w.condition)}; humidity ${safe(w.humidity)}%; precip ${safe(w.precipitation)}%; wind ${safe(w.wind)}. Source: ${safe(w.source, "platform")}.`
          );
          if (Array.isArray(w.forecast) && w.forecast.length) {
            const days = w.forecast
              .slice(0, 5)
              .map(
                (d) =>
                  `${safe(d.day || d.date)}: ${safe(d.high ?? d.max)}°/${safe(d.low ?? d.min)}° ${safe(d.condition)}`
              )
              .join(" | ");
            parts.push(`FORECAST: ${days}`);
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
          return `${i + 1}. ${safe(j.title)} @ ${safe(j.company)} - ${safe(j.location)} [${safe(j.source)}]`;
        });
        parts.push(
          `JOBS: ${items.length} listings in today's Opportunities cache. Sample:\n${sample.join("\n") || "(empty)"}`
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
        const sample = list.slice(0, 8).map((p, i) => {
          return `${i + 1}. ${safe(p.name || p.title)} (${safe(p.category || p.type)})`;
        });
        parts.push(
          `PLACES: ${list.length} Tourism Map pins cached. Sample:\n${sample.join("\n") || "(empty)"}`
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
      `NAVIGATOR SHORTCUTS:\nVisa:\n${pick(visa)}\nCampus:\n${pick(campus)}\nLanguage (KIIP/TOPIK/IELTS):\n${pick(lang, 3)}`
    );
  } catch {
    /* optional */
  }

  parts.push(
    `PLATFORM LINKS: /city-pulse · /opportunities · /tourism-map · /international-navigator`
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

  const snapshot = await buildLiveSnapshot();
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
