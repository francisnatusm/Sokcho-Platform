import { useEffect, useState } from "react";

export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const base =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const response = await fetch(`${base}${url}`, {
          signal: controller.signal,
          ...options,
        });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, loading, error };
}
