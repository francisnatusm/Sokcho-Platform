import * as cheerio from "cheerio";
import { getCached, setCached, pruneOldCaches } from "./firebaseService.js";
import { fetchPageHtml, hasBrightDataKey } from "./brightDataService.js";
import {
  enrichJobsLocal,
  guessJobType,
  looksEnglishFriendly,
  translateTitlesWithClaude,
  hangulRatio,
} from "./jobLocalize.js";

const CURATED_JOBS = [
  {
    title: "Cafe Barista (Part-time)",
    company: "Seorak Coffee",
    location: "Sokcho Jungang-dong",
    type: "Part-time",
    deadline: daysFromNow(5),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Weekend barista near the beach. Basic Korean helpful; English-speaking tourists welcome.",
  },
  {
    title: "Campus Intern — International Office",
    company: "Kyungdong University",
    location: "KDU Sokcho Campus",
    type: "Internship",
    deadline: daysFromNow(20),
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    source: "KDU",
    description:
      "Support international student events, orientation materials, and campus tours.",
  },
  {
    title: "Hotel Front Desk",
    company: "Sokcho Bay Hotel",
    location: "Daepo-dong",
    type: "Full-time",
    deadline: daysFromNow(12),
    url: "https://www.saramin.co.kr",
    englishFriendly: false,
    source: "Curated",
    description:
      "Full-time front desk associate for a coastal hotel. Korean required.",
  },
  {
    title: "English Conversation Tutor (After-school)",
    company: "Sokcho Language Hub",
    location: "Joyang-dong",
    type: "Part-time",
    deadline: daysFromNow(14),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Help local middle-school students practice spoken English 3 evenings per week.",
  },
  {
    title: "Restaurant Server — Seafood House",
    company: "Abai Raw Fish Restaurant",
    location: "Cheongho-dong",
    type: "Part-time",
    deadline: daysFromNow(8),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Evening shifts serving tourists. Menu cards available in English and Korean.",
  },
  {
    title: "Guest House Receptionist",
    company: "Seorak Stay Guesthouse",
    location: "Seorak-dong",
    type: "Part-time",
    deadline: daysFromNow(10),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Check-in support for international backpackers. Flexible hours around class schedule.",
  },
  {
    title: "Marketing Intern — Tourism Startup",
    company: "Gangwon Travel Lab",
    location: "Sokcho / Remote hybrid",
    type: "Internship",
    deadline: daysFromNow(25),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Create bilingual social media content about Sokcho attractions and student life.",
  },
  {
    title: "Library Student Assistant",
    company: "KDU Library",
    location: "KDU Sokcho Campus",
    type: "Part-time",
    deadline: daysFromNow(18),
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    source: "KDU",
    description:
      "Circulation desk support and bilingual help for international students.",
  },
  {
    title: "Convenience Store Staff (Night)",
    company: "CU Sokcho Central",
    location: "Jungang-dong",
    type: "Part-time",
    deadline: daysFromNow(6),
    url: "https://www.saramin.co.kr",
    englishFriendly: false,
    source: "Curated",
    description:
      "Night shift cashier and restocking. Korean conversation required.",
  },
  {
    title: "Ski Resort Winter Staff",
    company: "Seorak Ski Village Partner",
    location: "Near Sokcho / Yangyang",
    type: "Part-time",
    deadline: daysFromNow(40),
    url: "https://www.saramin.co.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Seasonal ticket booth and guest guidance. Peak winter weekends.",
  },
  {
    title: "IT Support Intern",
    company: "KDU Smart Campus Team",
    location: "KDU Sokcho Campus",
    type: "Internship",
    deadline: daysFromNow(22),
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    source: "KDU",
    description:
      "Help maintain campus Wi-Fi labs, student portals, and basic troubleshooting.",
  },
  {
    title: "Kitchen Assistant",
    company: "Sokcho Central Market Kitchen",
    location: "Jungang Market",
    type: "Part-time",
    deadline: daysFromNow(9),
    url: "https://www.saramin.co.kr",
    englishFriendly: false,
    source: "Curated",
    description:
      "Prep and cleaning support during lunch rush. No experience required.",
  },
  {
    title: "Tour Guide Assistant (Weekends)",
    company: "Sokcho City Tour Desk",
    location: "Sokcho Expo / Beach area",
    type: "Part-time",
    deadline: daysFromNow(16),
    url: "https://www.sokcho.go.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Assist English-speaking tour groups with directions and attraction info.",
  },
  {
    title: "Data Entry Intern — City Open Data",
    company: "Sokcho Smart City Lab",
    location: "City Hall annex / Hybrid",
    type: "Internship",
    deadline: daysFromNow(30),
    url: "https://www.sokcho.go.kr",
    englishFriendly: true,
    source: "Curated",
    description:
      "Organize tourism and civic datasets for public dashboards. Excel/Sheets skills helpful.",
  },
  {
    title: "Hotel Housekeeping (Full-time)",
    company: "Lakeside Resort Sokcho",
    location: "Yeongrang-dong",
    type: "Full-time",
    deadline: daysFromNow(15),
    url: "https://www.saramin.co.kr",
    englishFriendly: false,
    source: "Curated",
    description: "Daily room cleaning and laundry support. Training provided.",
  },
  {
    title: "Campus Event Photographer",
    company: "KDU Student Union",
    location: "KDU Sokcho Campus",
    type: "Part-time",
    deadline: daysFromNow(11),
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    source: "KDU",
    description:
      "Photograph orientation and club events. Own camera preferred.",
  },
  {
    title: "Delivery Helper (E-bike)",
    company: "Local Delivery Coop",
    location: "Sokcho citywide",
    type: "Part-time",
    deadline: daysFromNow(7),
    url: "https://www.saramin.co.kr",
    englishFriendly: false,
    source: "Curated",
    description:
      "Lunch and dinner delivery shifts. License and e-bike rental options available.",
  },
  {
    title: "Research Assistant — Smart Computing",
    company: "KDU Smart Computing Lab",
    location: "KDU Sokcho Campus",
    type: "Internship",
    deadline: daysFromNow(28),
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    source: "KDU",
    description:
      "Support ML demos, dataset cleaning, and documentation for civic AI projects.",
  },
];

/** Karrot (당근알바) — primary for students. Region ID is authoritative. */
const KARROT_DONGS = [
  { name: "동명동", id: 1971 },
  { name: "금호동", id: 1972 },
  { name: "교동", id: 1973 },
  { name: "노학동", id: 1974 },
  { name: "조양동", id: 1975 },
  { name: "청호동", id: 1976 },
  { name: "영랑동", id: 1977 },
  { name: "대포동", id: 1978 },
  { name: "도문동", id: 1979 },
  { name: "설악동", id: 1980 },
  // Nearby towns students also commute to
  { name: "양양읍", id: 2086 },
  { name: "속초시", id: 1969 },
];

const KARROT_KEYWORDS = [
  "카페",
  "알바",
  "서빙",
  "편의점",
  "주방",
  "호텔",
  "배달",
  "매장",
  "과외",
  "청소",
  "리조트",
  "영어",
];

function karrotDongUrl(dong) {
  const slug = encodeURIComponent(`${dong.name}-${dong.id}`);
  return {
    name: "Karrot",
    platform: "karrot",
    label: `Karrot ${dong.name}`,
    url: `https://www.daangn.com/kr/jobs/?in=${slug}`,
    dong: dong.name,
  };
}

function karrotSearchUrl(dong, keyword) {
  return {
    name: "Karrot",
    platform: "karrot",
    label: `Karrot ${dong.name} ${keyword}`,
    url: `https://www.daangn.com/kr/jobs/?in=${encodeURIComponent(`${dong.name}-${dong.id}`)}&search=${encodeURIComponent(keyword)}`,
    dong: dong.name,
  };
}

function buildJobSources() {
  const sources = [];

  // Karrot neighborhoods (student-first)
  for (const dong of KARROT_DONGS) {
    sources.push(karrotDongUrl(dong));
  }

  // Keyword slices on hub dongs — pulls different subsets than the default feed
  for (const dong of KARROT_DONGS.filter((d) =>
    ["교동", "조양동", "노학동", "양양읍"].includes(d.name)
  )) {
    for (const keyword of KARROT_KEYWORDS) {
      sources.push(karrotSearchUrl(dong, keyword));
    }
  }

  // Saramin — multi-page + nearby cities for volume
  const saraminWords = ["속초", "양양", "고성군", "강릉"];
  for (const word of saraminWords) {
    for (let page = 1; page <= 5; page++) {
      sources.push({
        name: "Saramin",
        platform: "saramin",
        label: `Saramin ${word} p${page}`,
        url: `https://www.saramin.co.kr/zf_user/search?searchword=${encodeURIComponent(word)}&searchType=search&recruitPage=${page}&recruitPageCount=40`,
        selectors: [
          ".item_recruit .job_tit a",
          'a[href*="/zf_user/jobs/relay/view"]',
        ],
      });
    }
  }

  // Albamon — keyword + area pages
  const albamonWords = ["속초", "양양", "고성", "강릉"];
  for (const word of albamonWords) {
    for (let page = 1; page <= 4; page++) {
      sources.push({
        name: "Albamon",
        platform: "albamon",
        label: `Albamon ${word} p${page}`,
        url: `https://www.albamon.com/jobs/total?keyword=${encodeURIComponent(word)}&page=${page}`,
        selectors: ['a[href*="/jobs/detail/"]', 'a[href*="/job/"]'],
      });
    }
  }

  sources.push({
    name: "Albamon",
    platform: "albamon",
    label: "Albamon Sokcho area",
    url: "https://www.albamon.com/jobs/area?areas=A0500100",
    selectors: ['a[href*="/jobs/detail/"]', 'a[href*="/job/"]'],
  });

  // Secondary boards (often blocked; keep light)
  sources.push({
    name: "JobKorea",
    platform: "jobkorea",
    label: "JobKorea Sokcho",
    url: "https://www.jobkorea.co.kr/Search/?stext=%EC%86%8D%EC%B4%88",
    selectors: ['a[href*="/Recruit/GI_Read/"]', 'a[href*="/Recruit/"]'],
  });

  return sources;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function todayKey() {
  // Asia/Seoul calendar date (UTC+9) — must match dailyRefreshService / cron
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

function guessType(title = "", source = "") {
  return guessJobType(title, { source });
}

function looksEnglishFriendlySafe(title = "") {
  return looksEnglishFriendly(title);
}

const NAV_NOISE =
  /로그인|회원가입|고객센터|이용약관|공고 등록|후보자|채용상품|헤드헌팅|채용달력|기업리뷰|홈페이지 지원|공고 새 창|login|sign up|cookie|privacy|더보기|전체보기|인기 검색어/i;

const DONG_RE =
  /(동명동|금호동|교동|노학동|조양동|청호동|영랑동|대포동|도문동|설악동|중앙동|양양읍|속초|강릉|고성)/;

function titleFromKarrotHref(href) {
  try {
    const raw = decodeURIComponent(
      (href.split("/job-posts/")[1] || href.split("/kr/jobs/")[1] || "").replace(
        /\/$/,
        ""
      )
    );
    const parts = raw.split("-");
    if (parts.length < 2) return raw.replace(/-/g, " ");
    // Drop trailing id token
    if (/^[a-z0-9]{6,}$/i.test(parts[parts.length - 1])) {
      return parts.slice(0, -1).join(" ").trim() || raw;
    }
    return parts.slice(0, -1).join(" ").trim() || raw;
  } catch {
    return "";
  }
}

/** Karrot moved public job pages to jobs.daangn.com — www.daangn.com/job-posts 404s. */
function normalizeKarrotUrl(href = "") {
  if (!href) return href;
  try {
    const u = new URL(href, "https://www.daangn.com");
    const path = u.pathname.replace(/\/$/, "");
    const m =
      path.match(/\/(?:job-posts|kr\/jobs)\/(?:[^/]*-)?([a-z0-9]{6,})$/i) ||
      path.match(/\/([a-z0-9]{8,})$/i);
    const id = m?.[1];
    if (id) {
      return `https://jobs.daangn.com/job-posts/${id}`;
    }
    if (path.includes("/job-posts/") || path.includes("/kr/jobs/")) {
      // Keep slug path on the working host
      const slug = path.split("/").pop();
      return `https://jobs.daangn.com/job-posts/${slug}`;
    }
    return u.toString();
  } catch {
    return href;
  }
}

function parseKarrotJobs(html, source) {
  const $ = cheerio.load(html);
  const found = [];
  const seen = new Set();

  $('a[href*="/job-posts/"], a[href*="/kr/jobs/"]').each((_, el) => {
    let href = $(el).attr("href") || "";
    if (!href) return;
    try {
      href = new URL(href, "https://www.daangn.com").toString();
    } catch {
      return;
    }

    href = normalizeKarrotUrl(href);
    const idKey = href.split("?")[0];
    if (seen.has(idKey)) return;
    seen.add(idKey);

    const block = $(el).text().replace(/\s+/g, " ").trim();
    let title = titleFromKarrotHref($(el).attr("href") || "") || block.slice(0, 80);
    title = title.replace(/\s+/g, " ").trim();
    if (!title || title.length < 4 || title.length > 140) return;
    if (NAV_NOISE.test(title)) return;

    const wage = (block.match(/(시급|월급|건당|일급)\s*[\d,만\s]+원?/) || [])[0];
    const locMatch = block.match(DONG_RE);
    const location = locMatch
      ? `Sokcho ${locMatch[1]}`
      : source.dong
        ? `Sokcho ${source.dong}`
        : "Sokcho / Gangwon";

    found.push({
      title,
      company: "Karrot (당근알바)",
      location,
      type: guessType(`${title} ${block}`, "Karrot"),
      deadline: daysFromNow(14),
      url: href,
      englishFriendly: looksEnglishFriendlySafe(`${title} ${block}`),
      source: "Karrot",
      description: wage
        ? `${wage} · Local part-time listing from 당근알바 (${location}).`
        : `Local part-time listing from 당근알바 (${location}). Popular with students.`,
    });
  });

  return found;
}

function parseJobsFromHtml(html, source) {
  if (source.platform === "karrot" || source.name === "Karrot") {
    return parseKarrotJobs(html, source);
  }

  const $ = cheerio.load(html);
  const found = [];
  const seen = new Set();
  const selectors = source.selectors || ["a"];

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const title = $(el).text().replace(/\s+/g, " ").trim();
      let href = $(el).attr("href") || "";
      if (!title || title.length < 6 || title.length > 140) return;
      if (NAV_NOISE.test(title)) return;
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      try {
        href = new URL(href, source.url).toString();
      } catch {
        return;
      }

      const idKey =
        href.split("?")[0] +
        (href.match(/rec_idx=\d+|detail\/\d+|GI_Read\/\d+|job-posts\/[^/?#]+/)?.[0] ||
          href);
      if (seen.has(idKey) || seen.has(title)) return;
      seen.add(idKey);
      seen.add(title);

      const companyNear =
        $(el)
          .closest("li, article, div, tr")
          .find(".corp_name, .company, .company-name, .corp")
          .first()
          .text()
          .trim() || source.name;

      found.push({
        title,
        company: companyNear.slice(0, 80) || source.name,
        location: "Sokcho / Gangwon",
        type: guessType(title, source.name),
        deadline: daysFromNow(14),
        url: href,
        englishFriendly: looksEnglishFriendlySafe(title),
        source: source.name,
        description: `Listing from ${source.name} for Sokcho-area search.`,
      });
    });
  }

  return found;
}

async function scrapePlatform(source) {
  try {
    const html = await fetchPageHtml(source.url);
    if (!html || html.length < 500) {
      console.warn(`[jobs] ${source.label || source.name}: empty/blocked`);
      return [];
    }
    const jobs = parseJobsFromHtml(html, source);
    console.log(`[jobs] ${source.label || source.name}: ${jobs.length}`);
    return jobs;
  } catch (err) {
    console.warn(
      `[jobs] ${source.label || source.name} failed:`,
      err.message
    );
    return [];
  }
}

/** Run scrapes in small parallel batches to avoid rate limits. */
async function scrapeAllSources(sources, concurrency = 4) {
  const out = [];
  for (let i = 0; i < sources.length; i += concurrency) {
    const chunk = sources.slice(i, i + concurrency);
    const batches = await Promise.all(chunk.map(scrapePlatform));
    out.push(...batches.flat());
  }
  return out;
}

function dedupeJobs(jobs) {
  const merged = [];
  const seen = new Set();
  for (const job of jobs) {
    const urlKey = (job.url || "").split("?")[0].toLowerCase();
    const titleKey = (job.title || "").toLowerCase().replace(/\s+/g, "");
    const key = urlKey.includes("job-posts/") || urlKey.includes("detail/")
      ? urlKey
      : `${titleKey}|${urlKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(job);
  }
  return merged;
}

function sortJobsStudentFirst(jobs) {
  const rank = (j) => {
    if (j.source === "Karrot") return 0;
    if (j.source === "KDU") return 1;
    if (j.source === "Albamon") return 2;
    if (j.source === "Curated") return 3;
    return 4;
  };
  return [...jobs].sort((a, b) => rank(a) - rank(b));
}

async function enrichJobsWithEnglish(jobs, { useClaude = false, claudeLimit = 160 } = {}) {
  let enriched = enrichJobsLocal(jobs);

  if (useClaude) {
    const needClaude = [
      ...new Set(
        enriched
          .filter((j) => hangulRatio(j.titleEn || j.title) >= 0.35)
          .map((j) => j.title)
      ),
    ].slice(0, claudeLimit);

    if (needClaude.length) {
      try {
        const { translateJobTitlesBatch } = await import("./claudeService.js");
        const map = await translateTitlesWithClaude(
          needClaude,
          translateJobTitlesBatch
        );
        if (map.size) {
          enriched = enriched.map((j) => {
            const better = map.get(j.title);
            if (!better) return j;
            return { ...j, titleEn: better };
          });
          console.log(`[jobs] Claude translated ${map.size} titles`);
        }
      } catch (err) {
        console.warn("[jobs] Claude title enrich skipped:", err.message);
      }
    }
  }

  return enriched;
}

async function collectDailyJobs(forceRefresh = false) {
  const cacheId = `sokcho-${todayKey()}`;

  if (!forceRefresh) {
    const cached = await getCached("jobs_cache", cacheId);
    if (cached?.items?.length) {
      const cachedAt =
        cached.cachedAt?.toDate?.()?.toISOString?.() ||
        cached.cachedAt ||
        null;

      const needsEn = cached.items.some(
        (j) => !j.titleEn || hangulRatio(j.titleEn) >= 0.55
      );
      if (needsEn) {
        // Instant rule-based English so the UI updates without waiting on Claude
        const local = enrichJobsLocal(cached.items);
        await setCached("jobs_cache", cacheId, {
          ...cached,
          items: local,
          localizedAt: new Date().toISOString(),
        });

        // Polish leftover Hangul titles in the background (local/long-running only)
        if (!process.env.VERCEL) {
          enrichJobsWithEnglish(local, { useClaude: true, claudeLimit: 200 })
            .then(async (polished) => {
              await setCached("jobs_cache", cacheId, {
                ...cached,
                items: polished,
                localizedAt: new Date().toISOString(),
                claudeLocalized: true,
              });
              console.log("[jobs] background Claude title polish saved");
            })
            .catch((err) =>
              console.warn("[jobs] background polish failed:", err.message)
            );
        }

        return {
          items: local,
          cachedAt,
          source: "cache+localized",
        };
      }

      return {
        items: cached.items,
        cachedAt,
        source: "cache",
      };
    }
  }

  const sources = buildJobSources();
  let scraped = [];

  // On Vercel GET (no force): never run a multi-minute scrape in the request path.
  // Seed curated jobs into today's cache so Home / Opportunities stay fast.
  // Heavy scrape belongs to cron / POST /api/jobs/refresh only.
  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel && !forceRefresh) {
    const quick = sortJobsStudentFirst(enrichJobsLocal([...CURATED_JOBS]));
    await setCached("jobs_cache", cacheId, {
      items: quick,
      day: todayKey(),
      scrapedCount: 0,
      uniqueCount: quick.length,
      bySource: { Curated: quick.length },
      platforms: ["Curated"],
      localizedAt: new Date().toISOString(),
      note: "vercel-fast-seed",
    });
    return {
      items: quick,
      cachedAt: new Date().toISOString(),
      source: "curated",
    };
  }

  if (hasBrightDataKey()) {
    console.log(`[jobs] scraping ${sources.length} sources (Karrot-first)…`);
    scraped = await scrapeAllSources(sources, 4);
  } else {
    console.warn("[jobs] Bright Data key missing — curated jobs only");
  }

  const merged = sortJobsStudentFirst(
    dedupeJobs([...CURATED_JOBS, ...scraped])
  );
  // Rules first for speed; skip Claude polish on Vercel to avoid timeouts
  const localized = await enrichJobsWithEnglish(merged, {
    useClaude: !onVercel,
    claudeLimit: onVercel ? 0 : 200,
  });

  const bySource = localized.reduce((acc, j) => {
    acc[j.source] = (acc[j.source] || 0) + 1;
    return acc;
  }, {});

  await setCached("jobs_cache", cacheId, {
    items: localized,
    day: todayKey(),
    scrapedCount: scraped.length,
    uniqueCount: localized.length,
    bySource,
    platforms: [...new Set(sources.map((s) => s.name))],
    localizedAt: new Date().toISOString(),
  });

  const pruned = await pruneOldCaches("jobs_cache", {
    keepDays: 2,
    prefix: "sokcho-",
  });
  if (pruned) console.log(`[jobs] pruned ${pruned} old cache day(s)`);

  console.log(`[jobs] unique=${localized.length}`, bySource);

  return {
    items: localized,
    cachedAt: new Date().toISOString(),
    source: scraped.length ? "bright-data+curated" : "curated",
  };
}

export async function fetchJobs(filters = {}) {
  const forceRefresh = filters.refresh === "true" || filters.refresh === true;
  const { items, cachedAt, source } = await collectDailyJobs(forceRefresh);

  // Fix legacy Karrot www.daangn.com/job-posts URLs (404) → jobs.daangn.com
  let result = items.map((job) => {
    if (job.source !== "Karrot" && !String(job.url || "").includes("daangn.com")) {
      return job;
    }
    const fixed = normalizeKarrotUrl(job.url || "");
    return fixed && fixed !== job.url ? { ...job, url: fixed } : job;
  });

  if (filters.type && filters.type !== "all") {
    const wanted = String(filters.type).toLowerCase().replace(/[-\s]/g, "");
    result = result.filter(
      (job) =>
        (job.type || "").toLowerCase().replace(/[-\s]/g, "") === wanted
    );
  }

  if (filters.english === "true" || filters.english === true) {
    result = result.filter((job) => job.englishFriendly);
  }

  if (filters.q) {
    const q = String(filters.q).trim().toLowerCase();
    result = result.filter((job) =>
      [
        job.title,
        job.titleEn,
        job.company,
        job.location,
        job.description,
        job.descriptionEn,
        job.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return { items: result, cachedAt, source, day: todayKey() };
}

export async function refreshJobsForToday() {
  return collectDailyJobs(true);
}
