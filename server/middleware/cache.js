const store = new Map();

/**
 * Simple in-memory cache middleware.
 * Usage: cache(ttlMs) — e.g. cache(30 * 60 * 1000) for 30 minutes
 */
export default function cache(ttlMs = 30 * 60 * 1000) {
  return (req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const key = req.originalUrl;
    const cached = store.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      res.json(cached.data);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      store.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
}
