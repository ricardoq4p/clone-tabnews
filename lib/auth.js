export const SUPERADMIN_EMAIL = "ricardo.q4p@gmail.com";

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function getRoleForEmail(email = "") {
  return normalizeEmail(email) === normalizeEmail(SUPERADMIN_EMAIL)
    ? "superadmin"
    : "user";
}

export function isSuperadminEmail(email = "") {
  return getRoleForEmail(email) === "superadmin";
}

export function isSuperadminSession(session) {
  return session?.user?.role === "superadmin";
}
