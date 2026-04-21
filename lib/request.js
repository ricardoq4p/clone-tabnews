export function getClientIp(req) {
  const forwardedFor =
    typeof req?.headers?.get === "function"
      ? req.headers.get("x-forwarded-for")
      : req?.headers?.["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }

  return (
    (typeof req?.headers?.get === "function"
      ? req.headers.get("x-real-ip")
      : req?.headers?.["x-real-ip"]) ||
    req?.socket?.remoteAddress ||
    req?.connection?.remoteAddress ||
    "unknown"
  );
}
