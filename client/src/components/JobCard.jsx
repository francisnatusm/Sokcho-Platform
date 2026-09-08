import { useLanguage } from "../context/LanguageContext";

const TYPE_COLORS = {
  parttime: "bg-accent/10 text-accent",
  internship: "bg-warning/10 text-warning",
  fulltime: "bg-primary/10 text-primary",
  scholarship: "bg-success/10 text-success",
};

export default function JobCard({ job, onOpen }) {
  const { t, language } = useLanguage();
  const deadlineSoon = isWithinDays(job.deadline, 7);
  const typeKey = (job.type || "").toLowerCase().replace(/[-\s]/g, "");

  const title =
    language === "en"
      ? job.titleEn || job.title
      : job.title || job.titleEn;
  const description =
    language === "en"
      ? job.descriptionEn || job.description
      : job.description || job.descriptionEn;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            TYPE_COLORS[typeKey] || "bg-gray-100 text-gray-700"
          }`}
        >
          {labelJobType(job.type, t)}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-text-primary">{job.company}</p>
      <p className="text-sm text-text-secondary">{job.location}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.source && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {job.source}
          </span>
        )}
        {job.englishFriendly && (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            {t("jobs.englishFriendly")}
          </span>
        )}
        {job.deadline && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              deadlineSoon
                ? "bg-danger/10 text-danger"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {t("jobs.deadline", { date: job.deadline })}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      )}

      {language === "en" && job.title && job.titleEn && job.title !== job.titleEn ? (
        <p className="mt-2 text-[11px] text-text-secondary line-clamp-1" title={job.title}>
          KR: {job.title}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <a
          href={job.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onOpen?.(job)}
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          {t("jobs.apply")}
        </a>
      </div>
    </article>
  );
}

function labelJobType(type, t) {
  const key = (type || "").toLowerCase().replace(/[-\s]/g, "");
  if (key === "parttime") return t("jobs.parttime");
  if (key === "internship") return t("jobs.internship");
  if (key === "fulltime") return t("jobs.fulltime");
  if (key === "scholarship") return t("jobs.scholarship");
  return type || t("jobs.other");
}

function isWithinDays(deadline, days) {
  if (!deadline) return false;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  const diff = date.getTime() - Date.now();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}
