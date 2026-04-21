import crypto from "crypto";

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function getSuperadminEmail() {
  return normalizeEmail(process.env.SUPERADMIN_EMAIL || "");
}

export function getRoleForEmail(email = "") {
  const normalizedEmail = normalizeEmail(email);
  const superadminEmail = getSuperadminEmail();

  return Boolean(superadminEmail) && normalizedEmail === superadminEmail
    ? "superadmin"
    : "user";
}

export function isSuperadminEmail(email = "") {
  return getRoleForEmail(email) === "superadmin";
}

export function isSuperadminSession(session) {
  return session?.user?.role === "superadmin";
}

export function createSecureToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export function hashToken(token = "") {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}
