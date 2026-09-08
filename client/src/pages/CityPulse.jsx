import { useEffect, useMemo, useState } from "react";
import NewsCard from "../components/NewsCard";
import WeatherWidget from "../components/WeatherWidget";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../hooks/useFeedback";
import { getNews, getWeather, refreshNews } from "../utils/api";
import { buildPulseQuestions } from "../i18n/surveyQuestions";

const MOCK_NEWS = [
  {
    title: "속초시, 설악산 관광 활성화 방안 발표",
    description:
      "속초시가 설악산 일대 관광 인프라 개선과 외국인 관광객 유치 방안을 발표했다.",
    summaryEn:
      "Sokcho City announced plans to improve Seoraksan tourism infrastructure and attract more international visitors.",
    link: "https://www.sokcho.go.kr",
    pubDate: new Date().toISOString(),
    source: "Sokcho News",
  },
  {
    title: "경동대 국제학생 지원 프로그램 확대",
    description:
      "경동대학교가 국제학생을 위한 비자 상담과 한국어 지원 프로그램을 확대한다고 밝혔다.",
    summaryEn:
      "Kyungdong University expanded visa counseling and Korean language support programs for international students.",
    link: "https://www.kduniv.ac.kr",
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: "Campus Bulletin",
  },
];

export default function CityPulse() {
  const { language, setLanguage, t } = useLanguage();
  const { triggerFeedback, feedbackUI } = useFeedback();
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState(Date.now());

  const feedbackQuestions = useMemo(() => buildPulseQuestions(t), [t]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [newsData, weatherData] = await Promise.all([
        getNews().catch(() => null),
        getWeather().catch(() => null),
      ]);

      const items = Array.isArray(newsData)
        ? newsData
        : newsData?.items || MOCK_NEWS;
      setNews(items.length ? items : MOCK_NEWS);
      setWeather(weatherData);
      setUpdatedAt(Date.now());
    } catch (err) {
      setNews(MOCK_NEWS);
      setError(err.message || "Using offline sample data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!cancelled) await load();
    }

    boot();
    const refresh = setInterval(() => {
      if (!cancelled) load();
    }, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      await refreshNews();
      await load();
    } catch (err) {
      setError(err.message || "News refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFeedback("city-pulse", feedbackQuestions);
    }, 2 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [triggerFeedback, feedbackQuestions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return news;
    return news.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.summaryEn,
        item.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [news, query]);

  const minutesAgo = Math.max(0, Math.floor((Date.now() - updatedAt) / 60000));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("pulse.title")}</h1>
          <p className="mt-1 text-text-secondary">
            {t("pulse.subtitle")}
            {!loading ? ` · ${t("pulse.articlesToday", { count: news.length })}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-text-secondary">
            {t("pulse.lastUpdated", { n: minutesAgo })}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? t("common.refreshing") : t("pulse.refresh")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pulse.search")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "ko" : "en")}
              className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {language === "en" ? t("pulse.showKorean") : t("pulse.showEnglish")}
            </button>
          </div>

          {loading && <Loader label={t("pulse.loading")} />}
          {error && !loading && (
            <p className="mb-4 text-sm text-warning">{error}</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-text-secondary">{t("pulse.empty")}</p>
          )}
          <div className="space-y-4">
            {filtered.map((article, index) => (
              <NewsCard
                key={article.link || index}
                article={article}
                language={language}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <WeatherWidget weather={weather} />
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary">
              {t("pulse.announcements")}
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-text-secondary">
              <li>{t("pulse.a1")}</li>
              <li>{t("pulse.a2")}</li>
              <li>{t("pulse.a3")}</li>
            </ul>
          </div>
        </aside>
      </div>

      {feedbackUI}
    </div>
  );
}
