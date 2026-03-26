export function notFoundHandler(_req, res) {
  res.status(404).json({ ok: false, message: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message =
    status >= 500 ? "Internal server error" : err?.message || "Request failed";
  res.status(status).json({ ok: false, message });
}
