import { getCached, setCached } from "./firebaseService.js";
import { fetchPageHtml, hasBrightDataKey } from "./brightDataService.js";

const MOCK_WEATHER = {
  temp: 12,
  humidity: 58,
  wind: 3.2,
  precip: 10,
  condition: "Cloudy",
  icon: "Cloudy",
  feelsLike: null,
  updatedLabel: null,
  forecast: [],
  source: "mock",
};

const WEATHER_TTL_MS = 15 * 60 * 1000; // refresh often — weather moves fast
const SOKCHO = { lat: 38.207, lon: 128.592 };

function hasKmaKey() {
  const key = process.env.KMA_API_KEY || process.env.DATA_GO_KR_API_KEY;
  return key && !key.startsWith("your_");
}

function buildWeatherUrl(serviceKey, baseDate, baseTime) {
  const encodedKey = encodeURIComponent(serviceKey);
  return (
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst" +
    `?serviceKey=${encodedKey}` +
    `&pageNo=1&numOfRows=100&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=89&ny=130`
  );
}

function mapCondition(text = "") {
  const t = text.toLowerCase();
  if (/thunder|storm/.test(t)) return "Rain";
  if (/snow|sleet|blizzard/.test(t)) return "Snow";
  if (/rain|shower|drizzle|precip/.test(t)) return "Rain";
  if (/cloud|overcast|fog|mist|haze/.test(t)) return "Cloudy";
  if (/clear|sunny|fair/.test(t)) return "Sunny";
  return text || "Clear";
}

function mapWmoCode(code) {
  if ([0, 1].includes(code)) return "Sunny";
  if ([2, 3, 45, 48].includes(code)) return "Cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code))
    return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  return "Cloudy";
}

function parseNum(value) {
  if (value == null) return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Bright Data → Google weather widget (matches what people see searching "sokcho weather"). */
async function fetchGoogleWeatherViaBrightData() {
  if (!hasBrightDataKey()) return null;

  const html = await fetchPageHtml(
    "https://www.google.com/search?q=sokcho+weather&hl=en&gl=kr"
  );
  if (!html || html.length < 1000) return null;

  const pick = (id) => {
    const m = html.match(new RegExp(`id="${id}"[^>]*>([^<]*)`));
    return m?.[1]?.trim() || null;
  };

  const temp = parseNum(pick("wob_tm"));
  const conditionRaw = pick("wob_dc");
  const precip = parseNum(pick("wob_pp"));
  const humidity = parseNum(pick("wob_hm"));
  const windRaw = pick("wob_ws") || "";
  const updatedLabel = pick("wob_dts");

  let wind = parseNum(windRaw);
  if (/km\/h/i.test(windRaw) && wind != null) {
    wind = Math.round((wind / 3.6) * 10) / 10; // → m/s
  } else if (/mph/i.test(windRaw) && wind != null) {
    wind = Math.round(wind * 0.447 * 10) / 10;
  }

  if (temp == null) {
    console.warn("[weather] Google scrape missing temperature");
    return null;
  }

  const condition = mapCondition(conditionRaw || "Clear");
  return {
    temp,
    humidity,
    wind,
    precip,
    condition,
    icon: condition,
    updatedLabel,
    source: "google+brightdata",
  };
}

/** Open-Meteo — free forecast API for Sokcho coordinates. */
async function fetchOpenMeteoWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${SOKCHO.lat}&longitude=${SOKCHO.lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=Asia%2FSeoul&forecast_days=8`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  const data = await response.json();
  const cur = data.current || {};
  const daily = data.daily || {};

  const condition = mapWmoCode(Number(cur.weather_code));
  const forecast = (daily.time || []).map((date, i) => ({
    date,
    day: new Date(`${date}T12:00:00+09:00`).toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "Asia/Seoul",
    }),
    high: daily.temperature_2m_max?.[i] ?? null,
    low: daily.temperature_2m_min?.[i] ?? null,
    precip: daily.precipitation_probability_max?.[i] ?? null,
    condition: mapWmoCode(Number(daily.weather_code?.[i])),
  }));

  // Open-Meteo wind is km/h by default
  const windMs =
    cur.wind_speed_10m != null
      ? Math.round((Number(cur.wind_speed_10m) / 3.6) * 10) / 10
      : null;

  return {
    temp: cur.temperature_2m != null ? Number(cur.temperature_2m) : null,
    humidity:
      cur.relative_humidity_2m != null
        ? Number(cur.relative_humidity_2m)
        : null,
    wind: windMs,
    precip:
      cur.precipitation_probability != null
        ? Number(cur.precipitation_probability)
        : null,
    condition,
    icon: condition,
    forecast,
    source: "open-meteo",
  };
}

async function fetchKmaWeather() {
  if (!hasKmaKey()) return null;

  const serviceKey = process.env.KMA_API_KEY || process.env.DATA_GO_KR_API_KEY;
  const now = new Date();
  const baseDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const hour = now.getMinutes() < 40 ? now.getHours() - 1 : now.getHours();
  const baseTime = `${String(Math.max(hour, 0)).padStart(2, "0")}00`;

  const response = await fetch(buildWeatherUrl(serviceKey, baseDate, baseTime));
  const data = await response.json().catch(() => null);

  const authError = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
  if (!response.ok || authError) {
    console.warn(
      "[weather] KMA unavailable:",
      authError || `HTTP ${response.status}`
    );
    return null;
  }

  const items = data?.response?.body?.items?.item || [];
  if (!items.length) return null;

  const byCategory = Object.fromEntries(
    items.map((item) => [item.category, item.obsrValue])
  );

  const condition = mapSky(byCategory.PTY);
  return {
    temp: byCategory.T1H != null ? Number(byCategory.T1H) : null,
    humidity: byCategory.REH != null ? Number(byCategory.REH) : null,
    wind: byCategory.WSD != null ? Number(byCategory.WSD) : null,
    precip: null,
    condition,
    icon: condition,
    source: "kma",
  };
}

function mapSky(pty) {
  if (pty === "1" || pty === "2" || pty === "4") return "Rain";
  if (pty === "3") return "Snow";
  return "Clear";
}

function mergeWeather(primary, forecastSource) {
  if (!primary) return null;
  return {
    ...MOCK_WEATHER,
    ...primary,
    forecast: primary.forecast?.length
      ? primary.forecast
      : forecastSource?.forecast || [],
    // Prefer Google current (matches web search); keep Open-Meteo forecast
    source: primary.source,
  };
}

export async function fetchSokchoWeather(options = {}) {
  const forceRefresh = options.force === true;

  // READ PATH: serve last stored weather from DB (ignore short TTL).
  // WRITE PATH: force/cron fetches APIs and overwrites weather_cache/sokcho.
  if (!forceRefresh) {
    try {
      const cached = await getCached("weather_cache", "sokcho");
      if (cached?.temp != null) {
        const { cachedAt, ...weather } = cached;
        return weather;
      }
    } catch {
      /* optional */
    }
    return MOCK_WEATHER;
  }

  let google = null;
  let openMeteo = null;
  let kma = null;

  try {
    google = await fetchGoogleWeatherViaBrightData();
    if (google) console.log("[weather] Google+BD", google.temp, google.condition);
  } catch (err) {
    console.warn("[weather] Google+BD failed:", err.message);
  }

  try {
    openMeteo = await fetchOpenMeteoWeather();
  } catch (err) {
    console.warn("[weather] Open-Meteo failed:", err.message);
  }

  if (!google) {
    try {
      kma = await fetchKmaWeather();
    } catch (err) {
      console.warn("[weather] KMA failed:", err.message);
    }
  }

  const weather =
    mergeWeather(google, openMeteo) ||
    mergeWeather(openMeteo, null) ||
    mergeWeather(kma, openMeteo) ||
    MOCK_WEATHER;

  await setCached("weather_cache", "sokcho", weather);
  return weather;
}
