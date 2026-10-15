export function isObjectId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

export function validText(value, max = 5000) {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}

export function validEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

export function validImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return Boolean(
      cloud &&
        url.protocol === "https:" &&
        url.hostname === "res.cloudinary.com" &&
        !url.username &&
        !url.password &&
        url.pathname.startsWith(`/${cloud}/image/upload/`),
    );
  } catch {
    return false;
  }
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
