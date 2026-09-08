import { useLanguage } from "../context/LanguageContext";

export default function NewsCard({ article, language = "en" }) {
  const { t } = useLanguage();
  const title =
    language === "ko"
      ? article.title
      : article.summaryEn || article.titleEn || article.title;
  const body =
    language === "ko"
      ? article.description
      : article.summaryEn || article.descriptionEn || article.description;

  return (
    <article className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
        {article.source && <span>{article.source}</span>}
        {article.pubDate && <span>· {formatDate(article.pubDate, language)}</span>}
      </div>
      {body && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">
          {body}
        </p>
      )}
      {article.link && (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          {t("common.readMore")}
        </a>
      )}
    </article>
  );
}

function formatDate(value, language) {
  try {
    return new Date(value).toLocaleString(language === "ko" ? "ko-KR" : "en-US");
  } catch {
    return value;
  }
}
