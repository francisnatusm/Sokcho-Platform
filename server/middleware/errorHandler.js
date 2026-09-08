export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(`[error] ${req.method} ${req.path}:`, message);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && err.stack
      ? { stack: err.stack }
      : {}),
  });
}
