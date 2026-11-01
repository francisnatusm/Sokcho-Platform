import { useLanguage } from "../context/LanguageContext";

const ICONS = {
  Clear: "☀️",
  Sunny: "☀️",
  Cloudy: "☁️",
  Rain: "🌧️",
  Snow: "❄️",
  default: "🌤️",
};

function dayOrdinal(day) {
  const n = Number(day);
  const teen = n % 100;
  if (teen >= 11 && teen <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

function formatWeatherDate(day, language) {
  const iso =
    day ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const parts = String(iso).split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const date = Number(parts[2]);
  if (!year || !month || !date) return "";

  if (language === "ko") {
    return `${year}년 ${month}월 ${date}일`;
  }

  const monthName = new Date(Date.UTC(year, month - 1, date)).toLocaleString(
    "en-US",
    { month: "long", timeZone: "UTC" }
  );
  return `${monthName} ${dayOrdinal(date)}, ${year}`;
}

export default function WeatherWidget({ weather }) {
  const { t, language } = useLanguage();
  const data = weather || {
    temp: 12,
    humidity: 58,
    wind: 3.2,
    precip: 10,
    condition: "Cloudy",
    icon: "Cloudy",
    forecast: [],
  };

  const icon = ICONS[data.icon] || ICONS[data.condition] || ICONS.default;
  const forecast = Array.isArray(data.forecast) ? data.forecast.slice(0, 7) : [];
  const dateLabel = formatWeatherDate(data.day, language);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-text-primary">{t("weather.title")}</h2>
        {data.updatedLabel || dateLabel ? (
          <div className="text-right text-xs text-text-secondary">
            {data.updatedLabel ? <p>{data.updatedLabel}</p> : null}
            {dateLabel ? <p>{dateLabel}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-4xl" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="text-3xl font-bold text-text-primary">
            {data.temp != null ? `${data.temp}°C` : "—"}
          </p>
          <p className="text-sm text-text-secondary">
            {data.condition || t("weather.unknown")}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-text-secondary">{t("weather.precip")}</dt>
          <dd className="font-semibold text-text-primary">
            {data.precip != null ? `${data.precip}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">{t("weather.humidity")}</dt>
          <dd className="font-semibold text-text-primary">
            {data.humidity != null ? `${data.humidity}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-secondary">{t("weather.wind")}</dt>
          <dd className="font-semibold text-text-primary">
            {data.wind != null ? `${data.wind} m/s` : "—"}
          </dd>
        </div>
      </dl>

      {forecast.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
            {t("weather.forecast")}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {forecast.map((day) => (
              <div
                key={day.date || day.day}
                className="min-w-[3.25rem] flex-1 rounded-lg bg-background px-1.5 py-2 text-center"
              >
                <p className="text-[11px] font-medium text-text-secondary">
                  {day.day}
                </p>
                <p className="mt-1 text-sm" aria-hidden="true">
                  {ICONS[day.condition] || ICONS.default}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-text-primary">
                  {day.high != null ? Math.round(day.high) : "—"}°
                </p>
                <p className="text-[10px] text-text-secondary">
                  {day.low != null ? Math.round(day.low) : "—"}°
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.source ? (
        <p className="mt-3 text-[10px] text-text-secondary">
          {t("weather.source", { source: labelSource(data.source, t) })}
        </p>
      ) : null}
    </div>
  );
}

function labelSource(source, t) {
  if (source === "google+brightdata") return t("weather.src.google");
  if (source === "open-meteo") return t("weather.src.openMeteo");
  if (source === "kma") return t("weather.src.kma");
  return source;
}
