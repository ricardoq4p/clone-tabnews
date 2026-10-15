import crypto from "crypto";
export const RETENTION_DAYS = 90;
export const PRIVACY_VERSION = "2026-2";
export function expiredRetentionFilter(now = new Date()) {
  return {
    policyVersion: PRIVACY_VERSION,
    expiresAt: { $lte: new Date(now.getTime() - RETENTION_DAYS * 86400000) },
  };
}
export function retentionAuthorized(req, env = process.env) {
  if (
    env.PANTERALAB_RETENTION_ENABLED !== "true" ||
    env.VERCEL_ENV !== "production" ||
    env.VERCEL_PROJECT_ID !== "prj_FRcbozdufCmWfO6FNmFLtyYwKT1S" ||
    !env.CRON_SECRET ||
    env.CRON_SECRET.length < 32
  )
    return false;
  const header = req.headers?.authorization;
  if (typeof header !== "string" || header.length > 512) return false;
  const digest = (value) => crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(
    digest(header),
    digest(`Bearer ${env.CRON_SECRET}`),
  );
}
