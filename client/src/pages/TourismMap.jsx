import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MAP_PIN_COLORS } from "../components/MapPin";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { useFeedback } from "../hooks/useFeedback";
import { getAttractions, getVisitorStats } from "../utils/api";
import { buildMapQuestions } from "../i18n/surveyQuestions";

const SOKCHO = { lng: 128.5918, lat: 38.207 };
const CATEGORY_IDS = [
  { id: "attraction", color: MAP_PIN_COLORS.attraction },
  { id: "restaurant", color: MAP_PIN_COLORS.restaurant },
  { id: "hotel", color: MAP_PIN_COLORS.hotel },
  { id: "hospital", color: MAP_PIN_COLORS.hospital },
  { id: "bank", color: MAP_PIN_COLORS.bank },
  { id: "government", color: MAP_PIN_COLORS.government },
];

const MOCK_PLACES = [
  {
    name: "Seoraksan National Park",
    lat: 38.1195,
    lng: 128.4656,
    category: "attraction",
    description: "Famous mountain park with hiking trails and autumn foliage.",
    address: "Seoraksan-ro, Sokcho",
    phone: "033-636-7700",
    hours: "Sunrise–Sunset",
  },
  {
    name: "Sokcho Beach",
    lat: 38.2075,
    lng: 128.598,
    category: "attraction",
    description: "Central beach promenade near downtown Sokcho.",
    address: "Joyang-dong, Sokcho",
    phone: "",
    hours: "Always open",
  },
  {
    name: "Abai Village Restaurant Street",
    lat: 38.2045,
    lng: 128.5945,
    category: "restaurant",
    description: "Local seafood restaurants in historic Abai Village.",
    address: "Cheongho-dong, Sokcho",
    phone: "",
    hours: "11:00–21:00",
  },
  {
    name: "Sokcho Medical Center",
    lat: 38.206,
    lng: 128.578,
    category: "hospital",
    description: "General hospital with some English support available.",
    address: "Dongmyeong-dong, Sokcho",
    phone: "033-630-6000",
    hours: "24h emergency",
  },
  {
    name: "Sokcho City Hall",
    lat: 38.207,
    lng: 128.5918,
    category: "government",
    description: "Main municipal office for resident services.",
    address: "Jungang-ro, Sokcho",
    phone: "033-639-2114",
    hours: "09:00–18:00",
  },
  {
    name: "KB Bank Sokcho",
    lat: 38.2082,
    lng: 128.5925,
    category: "bank",
    description: "Bank branch with foreign-card ATM access.",
    address: "Jungang-dong, Sokcho",
    phone: "033-633-2114",
    hours: "09:00–16:00",
  },
];

const MOCK_STATS = [
  { month: "Mar 26", visitorCount: 2566970 },
  { month: "Apr 26", visitorCount: 2480432 },
  { month: "May 26", visitorCount: 3191114 },
  { month: "Jun 26", visitorCount: 2810902 },
  { month: "Jul 26", visitorCount: 3335318 },
  { month: "Aug 26", visitorCount: 3967026 },
];

function osmFallbackStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "© CARTO © OpenStreetMap",
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "osm" }],
  };
}

/** Raster MapTiler — more reliable than vector style in some local/WebGL setups */
function maptilerRasterStyle(key) {
  return {
    version: 8,
    sources: {
      maptiler: {
        type: "raster",
        tiles: [
          `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${key}`,
        ],
        tileSize: 256,
        attribution: "© MapTiler © OpenStreetMap",
      },
    },
    layers: [{ id: "maptiler", type: "raster", source: "maptiler" }],
  };
}

export default function TourismMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const fittedRef = useRef(false);
  const { t } = useLanguage();
  const { triggerFeedback, feedbackUI } = useFeedback();
  const [places, setPlaces] = useState(MOCK_PLACES);
  const [stats, setStats] = useState(MOCK_STATS);
  const [statsMeta, setStatsMeta] = useState({
    year: 2026,
    note: "Korea Tourism Data Lab (live)",
  });
  const [selected, setSelected] = useState(null);
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(CATEGORY_IDS.map((c) => c.id))
  );

  const CATEGORIES = useMemo(
    () =>
      CATEGORY_IDS.map((c) => ({
        ...c,
        label: t(`map.cat.${c.id}`),
      })),
    [t]
  );

  const mapQuestions = useMemo(() => buildMapQuestions(t), [t]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const pinClicksRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [attractions, visitorStats] = await Promise.all([
          getAttractions().catch(() => null),
          getVisitorStats().catch(() => null),
        ]);
        if (cancelled) return;
        const items = Array.isArray(attractions)
          ? attractions
          : attractions?.items;
        if (items?.length) {
          setPlaces(items);
          fittedRef.current = false;
        }
        const statsItems = Array.isArray(visitorStats)
          ? visitorStats
          : visitorStats?.items;
        if (statsItems?.length) setStats(statsItems);
        if (visitorStats && !Array.isArray(visitorStats)) {
          setStatsMeta({
            year: visitorStats.latestYm || visitorStats.year || null,
            note:
              visitorStats.note ||
              "Korea Tourism Data Lab (live)",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlaces = useMemo(
    () => places.filter((p) => activeCategories.has(p.category || "attraction")),
    [places, activeCategories]
  );

  const counts = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = places.filter((p) => (p.category || "attraction") === cat.id)
        .length;
      return acc;
    }, {});
  }, [places]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const key = import.meta.env.VITE_MAPTILER_API_KEY;
    const hasKey = Boolean(key && !String(key).startsWith("your_"));
    // Prefer raster basemap so tiles always paint (vector styles can stay blank)
    const style = hasKey ? maptilerRasterStyle(key) : osmFallbackStyle();

    const map = new Map({
      container: mapContainerRef.current,
      style,
      center: [SOKCHO.lng, SOKCHO.lat],
      zoom: 12.2,
      attributionControl: true,
    });
    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    // If style stalls, fall back to CARTO raster once
    let ready = false;
    const markReady = () => {
      ready = true;
      try {
        map.resize();
      } catch {
        /* ignore */
      }
      setMapReady(true);
    };

    map.on("load", markReady);
    map.on("idle", () => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    });

    const failSafe = setTimeout(() => {
      if (ready || !mapRef.current) return;
      try {
        map.setStyle(osmFallbackStyle());
        setMapError("Switched to backup map tiles");
        markReady();
      } catch {
        markReady();
      }
    }, 5000);

    map.on("error", (e) => {
      console.warn("[map]", e?.error?.message || e);
    });

    // Resize after layout settles (fixes blank canvas in some browsers)
    requestAnimationFrame(() => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    });

    return () => {
      clearTimeout(failSafe);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPlaces.forEach((place) => {
      if (place.lng == null || place.lat == null) return;
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "h-5 w-5 cursor-pointer rounded-full border-2 border-white shadow-md hover:scale-110";
      el.style.backgroundColor =
        MAP_PIN_COLORS[place.category] || MAP_PIN_COLORS.attraction;
      el.title = place.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(place);
        map.flyTo({
          center: [place.lng, place.lat],
          zoom: Math.max(map.getZoom(), 14),
          essential: true,
        });
        pinClicksRef.current += 1;
        if (pinClicksRef.current >= 3) {
          triggerFeedback("tourism-map", mapQuestions);
        }
      });

      const marker = new Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (!fittedRef.current && filteredPlaces.length > 1) {
      const lngs = filteredPlaces.map((p) => p.lng);
      const lats = filteredPlaces.map((p) => p.lat);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      if (
        Number.isFinite(minLng) &&
        Number.isFinite(maxLng) &&
        Number.isFinite(minLat) &&
        Number.isFinite(maxLat)
      ) {
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 48, maxZoom: 13, duration: 800 }
        );
        fittedRef.current = true;
      }
    }
  }, [filteredPlaces, mapReady, triggerFeedback, mapQuestions]);

  function toggleCategory(id) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-text-primary">{t("map.title")}</h1>
      <p className="mt-1 text-text-secondary">
        {t("map.subtitle")}
        {!loading ? ` · ${t("map.placesCount", { count: places.length })}` : ""}
      </p>

      {loading && <Loader label={t("map.loading")} />}
      {mapError && (
        <p className="mt-2 text-xs text-warning">
          {mapError === "Switched to backup map tiles" ? t("map.backup") : mapError}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div
          ref={mapContainerRef}
          className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border lg:h-[560px]"
        />

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            {!selected ? (
              <>
                <h2 className="font-bold text-text-primary">{t("map.categories")}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {t("map.categoriesHint")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        activeCategories.has(cat.id)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                      <span className="ml-1 opacity-80">
                        ({counts[cat.id] || 0})
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-text-secondary">
                  {t("map.showingPins", { count: filteredPlaces.length })}
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mb-2 text-xs font-medium text-accent"
                >
                  {t("map.backCategories")}
                </button>
                {selected.imageUrl ? (
                  <img
                    src={selected.imageUrl}
                    alt=""
                    className="mb-3 h-36 w-full rounded-lg object-cover"
                  />
                ) : null}
                <h2 className="text-lg font-bold text-text-primary">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
                  {t(`map.cat.${selected.category}`) !== `map.cat.${selected.category}`
                    ? t(`map.cat.${selected.category}`)
                    : selected.category}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {selected.description}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  {selected.address && (
                    <div>
                      <dt className="text-text-secondary">{t("common.address")}</dt>
                      <dd className="font-medium text-text-primary">
                        {selected.address}
                      </dd>
                    </div>
                  )}
                  {selected.phone && (
                    <div>
                      <dt className="text-text-secondary">{t("common.phone")}</dt>
                      <dd className="font-medium text-text-primary">
                        {selected.phone}
                      </dd>
                    </div>
                  )}
                  {selected.hours && (
                    <div>
                      <dt className="text-text-secondary">{t("common.hours")}</dt>
                      <dd className="font-medium text-text-primary">
                        {selected.hours}
                      </dd>
                    </div>
                  )}
                </dl>
                {selected.lat && selected.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                  >
                    {t("map.openGoogle")}
                  </a>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-text-primary">{t("map.visitors")}</h2>
            <p className="mt-1 text-xs text-text-secondary">
              {statsMeta.note || t("map.visitorsNote")}
              {statsMeta.year
                ? ` · ${t("map.through", { ym: statsMeta.year })}`
                : ""}
            </p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : `${Math.round(v / 1000)}k`
                    }
                    width={42}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      t("map.visitorsLabel"),
                    ]}
                  />
                  <Bar dataKey="visitorCount" fill="#1E3A5F" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>

      {feedbackUI}
    </div>
  );
}
