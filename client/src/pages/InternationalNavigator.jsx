import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../hooks/useFeedback";
import { getNavigatorSection } from "../utils/api";
import { buildNavQuestions } from "../i18n/surveyQuestions";

const TAB_IDS = ["visa", "services", "campus", "culture", "language"];

export default function InternationalNavigator() {
  const { t } = useLanguage();
  const [section, setSection] = useState("visa");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [tabsVisited, setTabsVisited] = useState(1);
  const { triggerFeedback, feedbackUI } = useFeedback();

  const TABS = useMemo(
    () => TAB_IDS.map((id) => ({ id, label: t(`navPage.tab.${id}`) })),
    [t]
  );

  const feedbackQuestions = useMemo(() => buildNavQuestions(t), [t]);

  async function load(nextSection = section, force = false) {
    setLoading(true);
    try {
      const data = await getNavigatorSection(nextSection, force);
      setPayload(data);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(section, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const content = useMemo(() => {
    const items = payload?.content || [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((block) =>
      [block.title, block.body, block.address, block.phone, ...(block.tips || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payload, query]);

  function handleTabChange(next) {
    if (next === section) return;
    setQuery("");
    setSection(next);
    setTabsVisited((count) => {
      const updated = count + 1;
      if (updated >= 2) {
        triggerFeedback("international-navigator", feedbackQuestions);
      }
      return updated;
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load(section, true);
    } finally {
      setRefreshing(false);
    }
  }

  const tabMeta = TABS.find((tab) => tab.id === section);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("navPage.title")}
          </h1>
          <p className="mt-1 text-text-secondary">{t("navPage.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? t("common.refreshing") : t("navPage.refresh")}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  section === tab.id
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-text-primary">
              {tabMeta?.label || payload?.title}
            </h2>
            {payload?.summary ? (
              <p className="mt-1 text-sm text-text-secondary">{payload.summary}</p>
            ) : null}
            <p className="mt-2 text-xs text-text-secondary">
              {t("navPage.contentNote")}
            </p>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("navPage.search")}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {loading ? (
            <Loader label={t("navPage.loading")} />
          ) : content.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("navPage.empty")}</p>
          ) : (
            <div className="space-y-6">
              {content.map((block, index) => (
                <article
                  key={`${block.title}-${index}`}
                  className="border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="text-lg font-bold text-text-primary">
                    {block.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {block.body}
                  </p>

                  {(block.address || block.phone || block.hours) && (
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {block.address && (
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-text-secondary">
                            {t("common.address")}
                          </dt>
                          <dd className="font-medium text-text-primary">
                            {block.address}
                          </dd>
                        </div>
                      )}
                      {block.phone && (
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-text-secondary">
                            {t("common.phone")}
                          </dt>
                          <dd className="font-medium text-text-primary">
                            <a href={`tel:${block.phone}`} className="hover:underline">
                              {block.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {block.hours && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs uppercase tracking-wide text-text-secondary">
                            {t("common.hours")}
                          </dt>
                          <dd className="font-medium text-text-primary">
                            {block.hours}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {Array.isArray(block.tips) && block.tips.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
                      {block.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  )}

                  {block.link &&
                    (block.link.startsWith("/") ? (
                      <Link
                        to={block.link}
                        className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                      >
                        {t("common.openPlatform")}
                      </Link>
                    ) : (
                      <a
                        href={block.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                      >
                        {t("common.openOfficial")}
                      </a>
                    ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {feedbackUI}
    </div>
  );
}
