import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-semibold text-text-primary">{t("footer.platform")}</span>
          <span className="mt-1 block text-xs sm:mt-0 sm:ml-2 sm:inline">
            {t("footer.tagline")}
          </span>
        </p>
        <p>
          {t("footer.developedBy")}{" "}
          <a
            href="https://francisnatusm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text-primary underline-offset-2 hover:text-primary hover:underline"
          >
            Francis Natus Mugisha
          </a>
        </p>
      </div>
    </footer>
  );
}
