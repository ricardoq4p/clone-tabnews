export function getClientIp(req) {
  // Enable only behind a proxy that overwrites these headers.
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const header = (name) =>
      typeof req?.headers?.get === "function"
        ? req.headers.get(name)
        : req?.headers?.[name];
    const forwarded = header("x-forwarded-for");
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (typeof value === "string" && value.trim())
      return value.split(",")[0].trim();
    const real = header("x-real-ip");
    if (typeof real === "string" && real.trim()) return real.trim();
  }
  return (
    req?.socket?.remoteAddress || req?.connection?.remoteAddress || "unknown"
  );
}
