import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getJobs, getNews, getWeather } from "../utils/api";

export default function Home() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    temp: "—",
    headline: "",
    jobs: "—",
  });

  const cards = [
    {
      to: "/city-pulse",
      title: t("nav.cityPulse"),
      description: t("home.card.cityPulse.desc"),
    },
    {
      to: "/opportunities",
      title: t("nav.opportunities"),
      description: t("home.card.opportunities.desc"),
    },
    {
      to: "/tourism-map",
      title: t("nav.tourismMap"),
      description: t("home.card.tourism.desc"),
    },
    {
      to: "/international-navigator",
      title: t("nav.navigator"),
      description: t("home.card.navigator.desc"),
    },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const next = {
        temp: "—",
        headline: t("home.loadingNews"),
        jobs: "—",
      };

      try {
        const weather = await getWeather();
        if (weather?.temp != null) next.temp = `${weather.temp}°C`;
      } catch {
        /* keep */
      }

      try {
        const news = await getNews();
        const items = Array.isArray(news) ? news : news?.items;
        const first = items?.[0];
        if (first) {
          next.headline =
            language === "en"
              ? first.summaryEn || first.titleEn || first.title
              : first.title || first.summaryEn;
        }
      } catch {
        /* keep */
      }

      try {
        const jobs = await getJobs();
        if (Array.isArray(jobs?.items)) next.jobs = String(jobs.items.length);
      } catch {
        /* keep */
      }

      if (!cancelled) setStats(next);
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [language, t]);

  return (
    <div>
      <section className="bg-gradient-to-br from-[#1E3A5F] via-[#2E5A8F] to-[#3B82F6] px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90 sm:text-xl">
            {t("home.subtitle")}
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:grid-cols-3 sm:px-6">
          <Stat label={t("home.statTemp")} value={stats.temp} />
          <Stat label={t("home.statHeadline")} value={stats.headline} />
          <Stat label={t("home.statJobs")} value={stats.jobs} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-xl border border-border bg-surface p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <h2 className="text-xl font-bold text-text-primary">
                {card.title}
              </h2>
              <p className="mt-2 text-text-secondary">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-background px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-primary">
        {value}
      </p>
    </div>
  );
}
