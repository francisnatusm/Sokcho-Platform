import * as cheerio from "cheerio";
import { summarizeNewsArticle } from "./claudeService.js";
import { getCached, setCached } from "./firebaseService.js";
import { fetchPageHtml, hasBrightDataKey } from "./brightDataService.js";

const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_ITEMS = 60;
const MAX_SUMMARIES = 8;

const MOCK_NEWS = [
  {
    title: "속초시, 설악산 관광 활성화 방안 발표",
    description:
      "속초시가 설악산 일대 관광 인프라 개선과 외국인 관광객 유치 방안을 발표했다.",
    link: "https://www.sokcho.go.kr",
    pubDate: new Date().toISOString(),
    source: "Sokcho City",
    summaryEn:
      "Sokcho City announced plans to improve Seoraksan tourism infrastructure and attract more international visitors.",
  },
  {
    title: "경동대 국제학생 대상 취업·비자 상담 확대",
    description:
      "경동대학교가 국제학생을 위한 아르바이트 안내와 비자 상담 서비스를 학기 중 확대 운영한다.",
    link: "https://www.kduniv.ac.kr",
    pubDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    source: "KDU Campus",
    summaryEn:
      "Kyungdong University expanded part-time job guidance and visa counseling services for international students.",
  },
  {
    title: "속초 해수욕장 주말 교통·주차 안내",
    description:
      "속초시가 주말 해수욕장 방문객을 위해 임시 주차장과 셔틀버스 운행 정보를 공개했다.",
    link: "https://www.sokcho.go.kr",
    pubDate: new Date(Date.now() - 5 * 3600000).toISOString(),
    source: "Sokcho City",
    summaryEn:
      "Sokcho City published weekend beach parking and shuttle bus information for visitors.",
  },
];

const RSS_QUERIES = ["속초", "속초시", "설악산", "경동대학교 속초"];

const BD_SOURCES = [
  {
    name: "Daum",
    url: "https://search.daum.net/search?w=news&q=%EC%86%8D%EC%B4%88%EC%8B%9C&sort=recency",
  },
  {
    name: "Naver",
    url: "https://search.naver.com/search.naver?where=news&query=%EC%86%8D%EC%B4%88%EC%8B%9C&sort=1",
  },
  {
    name: "Daum Seorak",
    url: "https://search.daum.net/search?w=news&q=%EC%84%A4%EC%95%85%EC%82%B0&sort=recency",
  },
];

function hasNaverKeys() {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  return (
    id &&
    secret &&
    !id.startsWith("your_") &&
    !secret.startsWith("your_")
  );
}

function todayKey() {
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

function stripHtml(value = "") {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title = "") {
  return stripHtml(title)
    .replace(/\s*[-|]\s*(v\.daum\.net|뉴스1|YTN|.*뉴스)\s*$/i, "")
    .replace(/새 창 열림/g, "")
    .trim();
}

function isRelevant(title = "", description = "") {
  const text = `${title} ${description}`;
  return /속초|설악|경동대|강원|양양|고성|대포항|동명동|조양동|청초/.test(text);
}

function looksLikeHeadline(title = "") {
  if (title.length < 12 || title.length > 90) return false;
  if (/새 창 열림|바로가기|더보기|로그인/.test(title)) return false;
  // Skip body-paragraph scrapes
  if ((title.match(/\s/g) || []).length > 18) return false;
  if (/멤버들이|제공 는|운영현장을 확인/.test(title)) return false;
  return true;
}

function dedupeNews(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.title || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .slice(0, 60);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchGoogleNewsRss(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SokchoPlatform/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!response.ok) {
    throw new Error(`Google News RSS failed (${response.status})`);
  }
  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $("item").each((_i, el) => {
    const rawTitle = $(el).find("title").text();
    const title = cleanTitle(rawTitle);
    const link = $(el).find("link").text().trim();
    const description = stripHtml($(el).find("description").text());
    const source =
      $(el).find("source").text().trim() ||
      rawTitle.split(" - ").slice(-1)[0] ||
      "Google News";
    const pubDate = $(el).find("pubDate").text();

    if (!title || title.length < 8) return;
    if (!looksLikeHeadline(title)) return;
    if (!isRelevant(title, description)) return;

    items.push({
      title,
      description: description || title,
      link: link || `https://news.google.com/search?q=${encodeURIComponent(title)}`,
      pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source,
      summaryEn: description || title,
      origin: "google-rss",
    });
  });

  return items;
}

function parseDaumHtml(html) {
  const $ = cheerio.load(html);
  const found = [];
  $('a[href*="v.daum.net"], a[href*="news.daum"]').each((_i, el) => {
    const title = cleanTitle($(el).text());
    let href = $(el).attr("href") || "";
    if (!title || title.length < 12 || title.length > 90) return;
    if (!looksLikeHeadline(title)) return;
    if (!isRelevant(title)) return;
    try {
      href = new URL(href, "https://search.daum.net").toString();
    } catch {
      return;
    }
    found.push({
      title,
      description: title,
      link: href,
      pubDate: new Date().toISOString(),
      source: "Daum News",
      summaryEn: title,
      origin: "brightdata-daum",
    });
  });
  return found;
}

function parseNaverHtml(html) {
  const $ = cheerio.load(html);
  const found = [];

  // New Naver fender UI — article outbound links
  $(".fds-news-item-list-tab a[href]").each((_i, el) => {
    const title = cleanTitle($(el).text());
    let href = $(el).attr("href") || "";
    if (!/^https?:/.test(href)) return;
    if (/keep\.naver|nid\.naver|help\.naver|channelPromotion/i.test(href)) return;
    if (!looksLikeHeadline(title)) return;
    if (!isRelevant(title)) return;
    found.push({
      title,
      description: title,
      link: href,
      pubDate: new Date().toISOString(),
      source: "Naver News",
      summaryEn: title,
      origin: "brightdata-naver",
    });
  });

  // Fallback: titles embedded in page JSON
  if (found.length < 5) {
    const titles = [
      ...html.matchAll(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g),
    ]
      .map((m) =>
        cleanTitle(
          m[1]
            .replace(/\\u003c\/?mark\\u003e/g, "")
            .replace(/&quot;/g, '"')
            .replace(/\\"/g, '"')
        )
      )
      .filter((t) => looksLikeHeadline(t) && isRelevant(t));

    for (const title of [...new Set(titles)]) {
      found.push({
        title,
        description: title,
        link: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(title)}`,
        pubDate: new Date().toISOString(),
        source: "Naver News",
        summaryEn: title,
        origin: "brightdata-naver",
      });
    }
  }

  return found;
}

async function scrapeBrightDataNews() {
  if (!hasBrightDataKey()) return [];

  const batches = await Promise.all(
    BD_SOURCES.map(async (source) => {
      try {
        const html = await fetchPageHtml(source.url);
        if (!html || html.length < 500) {
          console.warn(`[news] ${source.name}: empty`);
          return [];
        }
        const parsed = source.name.startsWith("Naver")
          ? parseNaverHtml(html)
          : parseDaumHtml(html);
        console.log(`[news] ${source.name}: ${parsed.length}`);
        return parsed;
      } catch (err) {
        console.warn(`[news] ${source.name} failed:`, err.message);
        return [];
      }
    })
  );

  return batches.flat();
}

async function fetchNaverApiNews() {
  if (!hasNaverKeys()) return [];

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", "속초");
  url.searchParams.set("display", "30");
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
    },
  });
  if (!response.ok) {
    console.warn(`[news] Naver API ${response.status}`);
    return [];
  }

  const data = await response.json();
  return (data.items || [])
    .map((item) => {
      const title = cleanTitle(item.title);
      const description = stripHtml(item.description);
      return {
        title,
        description,
        link: item.originallink || item.link,
        pubDate: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        source: item.originallink
          ? (() => {
              try {
                return new URL(item.originallink).hostname;
              } catch {
                return "Naver";
              }
            })()
          : "Naver",
        summaryEn: description || title,
        origin: "naver-api",
      };
    })
    .filter((item) => isRelevant(item.title, item.description));
}

async function enrichSummaries(items) {
  const top = items.slice(0, MAX_SUMMARIES);
  const rest = items.slice(MAX_SUMMARIES);

  const enriched = await Promise.all(
    top.map(async (item) => {
      try {
        const summaryEn = await summarizeNewsArticle(
          `${item.title}\n${item.description}`
        );
        return { ...item, summaryEn: summaryEn || item.summaryEn || item.description };
      } catch {
        return item;
      }
    })
  );

  return [...enriched, ...rest];
}

async function collectNews(forceRefresh = false) {
  const cacheId = `sokcho-${todayKey()}`;

  if (!forceRefresh) {
    // Prefer today's daily snapshot
    const daily = await getCached("news_cache", cacheId);
    if (daily?.items?.length) {
      return daily.items;
    }

    const legacy = await getCached("news_cache", "sokcho");
    if (
      legacy?.items?.length &&
      legacy.cachedAt &&
      Date.now() - new Date(legacy.cachedAt).getTime() < CACHE_TTL_MS
    ) {
      return legacy.items;
    }
  }

  console.log("[news] collecting Sokcho headlines…");

  const buckets = await Promise.allSettled([
    ...RSS_QUERIES.map((q) => fetchGoogleNewsRss(q)),
    scrapeBrightDataNews(),
    fetchNaverApiNews(),
  ]);

  const scraped = buckets.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  let merged = dedupeNews(scraped)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, MAX_ITEMS);

  if (!merged.length) {
    console.warn("[news] scrape empty — using curated fallback");
    merged = MOCK_NEWS;
  } else {
    merged = await enrichSummaries(merged);
  }

  const payload = {
    items: merged,
    day: todayKey(),
    count: merged.length,
    sources: [...new Set(merged.map((i) => i.origin).filter(Boolean))],
  };

  await setCached("news_cache", cacheId, payload);
  await setCached("news_cache", "sokcho", payload);

  console.log(`[news] unique=${merged.length}`, payload.sources);
  return merged;
}

export async function fetchSokchoNews(options = {}) {
  return collectNews(options.force === true);
}

export async function refreshNewsForToday() {
  return collectNews(true);
}
