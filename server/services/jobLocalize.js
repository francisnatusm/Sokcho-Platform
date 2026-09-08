/**
 * Localize scraped Korean job listings for international users.
 * Rule-based first (fast); optional Claude batch for leftover titles.
 */

const TITLE_DICT = [
  [/외국인\s*(불가능|불가|안\s*됨|금지)/g, " (foreigners not eligible)"],
  [/외국인\s*가능/g, " (foreigners welcome)"],
  [/내국인\s*만/g, " (Koreans only)"],
  [/한국인\s*만/g, " (Koreans only)"],
  [/영어\s*가능/g, " (English OK)"],
  [/영어\s*우대/g, " (English preferred)"],
  [/영어\s*회화/g, " English conversation "],
  [/아르바이트|알바/g, " part-time "],
  [/정규직/g, " full-time "],
  [/계약직/g, " contract "],
  [/인턴/g, " intern "],
  [/홀서빙|서빙/g, " server "],
  [/주방\s*보조|주방보조/g, " kitchen assistant "],
  [/주방/g, " kitchen "],
  [/카페|커피/g, " cafe "],
  [/바리스타/g, " barista "],
  [/배달해주실\s*분|배달해\s*주실\s*분/g, " delivery helper "],
  [/택배/g, " parcel "],
  [/지입\s*기사|지입기사/g, " contractor driver "],
  [/라이더|배달/g, " delivery "],
  [/기사\s*모집/g, " driver wanted "],
  [/운전/g, " driving "],
  [/청소|하우스키핑/g, " cleaning "],
  [/설거지/g, " dishwashing "],
  [/계산|캐셔|카운터/g, " cashier "],
  [/매장\s*관리|매장관리/g, " store staff "],
  [/편의점/g, " convenience store "],
  [/호텔|리조트/g, " hotel "],
  [/프론트데스크|프론트/g, " front desk "],
  [/게스트하우스|민박/g, " guesthouse "],
  [/관광|투어/g, " tourism "],
  [/가이드/g, " guide "],
  [/과외|튜터/g, " tutor "],
  [/강사/g, " instructor "],
  [/사무\s*보조|사무보조/g, " office assistant "],
  [/사무실/g, " office "],
  [/데이터/g, " data "],
  [/개발|프로그래머/g, " developer "],
  [/식당|음식점|맛집/g, " restaurant "],
  [/횟집|회센터/g, " seafood restaurant "],
  [/치킨|피자/g, " food shop "],
  [/주점|술집|호프/g, " pub "],
  [/포장/g, " packaging "],
  [/재고|물류|창고/g, " warehouse "],
  [/생산|공장/g, " factory "],
  [/건설|현장/g, " construction "],
  [/돌봄|요양|간병/g, " care work "],
  [/육아|보육/g, " childcare "],
  [/급구/g, " urgent "],
  [/주말/g, " weekend "],
  [/평일/g, " weekday "],
  [/야간|밤\s*근무/g, " night shift "],
  [/오전/g, " morning "],
  [/오후/g, " afternoon "],
  [/당일/g, " same-day "],
  [/단기/g, " short-term "],
  [/장기/g, " long-term "],
  [/경력\s*무관|무경력|초보\s*가능/g, " beginners OK "],
  [/경력자/g, " experienced "],
  [/남여|남녀/g, " "],
  [/속초/g, " Sokcho "],
  [/양양/g, " Yangyang "],
  [/고성/g, " Goseong "],
  [/강릉/g, " Gangneung "],
  [/주문진/g, " Jumunjin "],
  [/설악산|설악/g, " Seoraksan "],
  [/조양동/g, " Joyang-dong "],
  [/노학동/g, " Nohak-dong "],
  [/교동/g, " Gyo-dong "],
  [/청호동/g, " Cheongho-dong "],
  [/동명동/g, " Dongmyeong-dong "],
  [/중앙동/g, " Jungang-dong "],
  [/영랑동/g, " Yeongrang-dong "],
  [/대포동|대포/g, " Daepo "],
  [/먹거리촌/g, " food village "],
  [/역전할머니/g, " Yeokjeon Halmeoni "],
  [/인근|근처/g, " nearby "],
  [/집\s*키|집키|열쇠/g, " house key "],
  [/하나/g, " "],
  [/구합니다|구함|모집|구인|채용|모십니다/g, " wanted "],
  [/에\s+/g, " "],
  [/을|를|이|가|은|는|의|로|으로/g, " "],
];

export function hangulRatio(text = "") {
  const chars = [...String(text)].filter((c) => /[A-Za-z가-힣]/.test(c));
  if (!chars.length) return 0;
  const hangul = chars.filter((c) => /[가-힣]/.test(c)).length;
  return hangul / chars.length;
}

export function looksEnglishFriendly(text = "") {
  const t = String(text);
  if (
    /외국인\s*(불가능|불가|안\s*됨|금지)|내국인\s*만|한국인\s*만|외국인\s*안\s*됨|no\s*foreigners?/i.test(
      t
    )
  ) {
    return false;
  }
  return /영어\s*(가능|우대|회화)|외국인\s*가능|english\s*(ok|okay|friendly|speaking|welcome)|international\s*student|회화\s*튜터|영어\s*튜터/i.test(
    t
  );
}

export function guessJobType(text = "", { source } = {}) {
  const t = String(text).toLowerCase();
  if (t.includes("intern") || t.includes("인턴")) return "Internship";
  if (
    t.includes("part") ||
    t.includes("아르바이트") ||
    t.includes("알바") ||
    t.includes("파트") ||
    t.includes("시급") ||
    t.includes("건당") ||
    t.includes("일급") ||
    source === "Karrot"
  ) {
    return "Part-time";
  }
  if (t.includes("정규") || t.includes("full")) return "Full-time";
  if (hangulRatio(text) > 0.3) return "Part-time";
  return "Full-time";
}

/** 시급 1만원 → Hourly pay ₩10,000 */
export function translateWagePhrase(phrase = "") {
  const raw = String(phrase).trim();
  if (!raw) return "";

  const kind =
    /시급/.test(raw)
      ? "Hourly"
      : /월급/.test(raw)
        ? "Monthly"
        : /일급/.test(raw)
          ? "Daily"
          : /건당/.test(raw)
            ? "Per task"
            : "Pay";

  const man = raw.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);
  if (man) {
    const n = Math.round(Number(man[1]) * 10000);
    return `${kind} ₩${n.toLocaleString("en-US")}`;
  }
  const won = raw.match(/([\d,]+)\s*원/);
  if (won) {
    const n = Number(won[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return `${kind} ₩${n.toLocaleString("en-US")}`;
  }
  return raw;
}

export function translateJobTitle(title = "") {
  let out = String(title).trim();
  if (!out) return "";
  if (hangulRatio(out) < 0.15) return out;

  for (const [pattern, eng] of TITLE_DICT) {
    out = out.replace(pattern, eng);
  }

  // Drop leftover Hangul fragments; Claude polish fills gaps later when needed
  out = out
    .replace(/[가-힣]+/g, " ")
    .replace(/[^\w\s().,+\-/₩&]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();

  if (out && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }

  // If rules wiped too much, fall back to original (Claude will translate)
  if (!out || out.length < 3) return title;
  return out;
}

export function enrichJobLocal(job) {
  const blob = `${job.title || ""} ${job.description || ""}`;
  const titleEn = job.titleEn || translateJobTitle(job.title || "");
  let descriptionEn = job.descriptionEn || "";

  if (!descriptionEn && job.description) {
    descriptionEn = String(job.description).replace(
      /(시급|월급|건당|일급)\s*[\d,만\s]+원?/g,
      (m) => translateWagePhrase(m)
    );
    // Light phrase cleanup
    descriptionEn = descriptionEn
      .replace(/Local part-time listing from 당근알바/g, "Local part-time listing from Karrot")
      .replace(/당근알바/g, "Karrot");
  }

  return {
    ...job,
    type: guessJobType(`${job.title} ${job.description}`, {
      source: job.source,
    }),
    englishFriendly: looksEnglishFriendly(blob),
    titleEn,
    descriptionEn: descriptionEn || job.description || "",
  };
}

export function enrichJobsLocal(jobs = []) {
  return jobs.map(enrichJobLocal);
}

/**
 * Claude batch: translate leftover Hangul-heavy titles.
 * Returns Map(originalTitle -> englishTitle)
 */
export async function translateTitlesWithClaude(titles, translateBatchFn) {
  const unique = [...new Set(titles.filter(Boolean))];
  const need = unique.filter((t) => hangulRatio(t) >= 0.25);
  const map = new Map();
  if (!need.length || typeof translateBatchFn !== "function") return map;

  const CHUNK = 40;
  for (let i = 0; i < need.length; i += CHUNK) {
    const chunk = need.slice(i, i + CHUNK);
    try {
      const pairs = await translateBatchFn(chunk);
      for (const [ko, en] of pairs) {
        if (ko && en) map.set(ko, en);
      }
    } catch (err) {
      console.warn("[jobs] Claude title batch failed:", err.message);
      break;
    }
  }
  return map;
}
