import { useLanguage } from "../context/LanguageContext";

const ICONS = {
  Clear: "☀️",
  Sunny: "☀️",
  Cloudy: "☁️",
  Rain: "🌧️",
  Snow: "❄️",
  default: "🌤️",
};

export default function WeatherWidget({ weather }) {
  const { t } = useLanguage();
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

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-text-primary">{t("weather.title")}</h2>
        {data.updatedLabel ? (
          <p className="text-xs text-text-secondary">{data.updatedLabel}</p>
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
