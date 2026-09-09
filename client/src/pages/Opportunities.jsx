import { useEffect, useMemo, useState } from "react";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../hooks/useFeedback";
import { getJobs, refreshJobs } from "../utils/api";
import { buildJobsQuestions } from "../i18n/surveyQuestions";

const SCHOLARSHIPS = [
  {
    title: "KDU Global Excellence Scholarship",
    company: "Kyungdong University",
    location: "Sokcho Campus",
    type: "Scholarship",
    deadline: "2026-11-30",
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    description: "Partial tuition support for continuing international students.",
  },
];

const CAMPUS = [
  {
    title: "Student Assistant — Library Desk",
    company: "KDU Library",
    location: "KDU Sokcho Campus",
    type: "Part-time",
    deadline: "2026-10-15",
    url: "https://www.kduniv.ac.kr",
    englishFriendly: true,
    description: "Help with circulation desk and bilingual visitor support.",
  },
];

export default function Opportunities() {
  const { t } = useLanguage();
  const { triggerFeedback, feedbackUI } = useFeedback();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState("all");
  const [englishOnly, setEnglishOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const feedbackQuestions = useMemo(() => buildJobsQuestions(t), [t]);

  async function loadJobs() {
    setLoading(true);
    setError("");
    try {
      const data = await getJobs();
      setJobs(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Could not load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const typeOk =
        type === "all" ||
        (job.type || "").toLowerCase().replace(/[-\s]/g, "") ===
          type.replace(/[-\s]/g, "");
      const englishOk = !englishOnly || job.englishFriendly;
      const q = query.trim().toLowerCase();
      const searchOk =
        !q ||
        [job.title, job.company, job.location, job.description, job.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return typeOk && englishOk && searchOk;
    });
  }, [jobs, type, englishOnly, query]);

  function handleOpen() {
    triggerFeedback("opportunities", feedbackQuestions);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      await refreshJobs();
      await loadJobs();
    } catch (err) {
      setError(err.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("jobs.title")}</h1>
          <p className="mt-1 text-text-secondary">{t("jobs.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? t("common.refreshing") : t("jobs.refresh")}
        </button>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-text-primary">
            {t("jobs.lookingFor")}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("jobs.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "parttime", "internship", "fulltime"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  type === value
                    ? "bg-primary text-white"
                    : "border border-gray-300 text-gray-700"
                }`}
              >
                {labelType(value, t)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={englishOnly}
              onChange={(e) => setEnglishOnly(e.target.checked)}
            />
            {t("jobs.englishOnly")}
          </label>
        </div>

        <p className="text-sm text-text-secondary">
          {t("jobs.showing", { filtered: filtered.length, total: jobs.length })}
          {query.trim() ? t("jobs.forQuery", { q: query.trim() }) : ""}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-text-primary">
          {t("jobs.active")}
        </h2>
        {error && <p className="mb-3 text-sm text-warning">{error}</p>}
        {loading ? (
          <Loader label={t("jobs.loading")} />
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-text-secondary">
            {t("jobs.empty")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((job, index) => (
              <JobCard
                key={`${job.url || job.title}-${index}`}
                job={job}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-text-primary">
          {t("jobs.scholarships")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SCHOLARSHIPS.map((job) => (
            <JobCard key={job.title} job={job} onOpen={handleOpen} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-text-primary">
          {t("jobs.campus")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CAMPUS.map((job) => (
            <JobCard key={job.title} job={job} onOpen={handleOpen} />
          ))}
        </div>
      </section>

      {feedbackUI}
    </div>
  );
}

function labelType(value, t) {
  if (value === "all") return t("jobs.all");
  if (value === "parttime") return t("jobs.parttime");
  if (value === "internship") return t("jobs.internship");
  if (value === "fulltime") return t("jobs.fulltime");
  return value;
}
