// Test-only confirmation links: never active on production or an unrelated project.
const PROJECT_ID = "prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe";
export function isPreviewRegistrationEnabled(env = process.env) {
  if (
    env.PANTERALAB_PREVIEW_REGISTRATION !== "true" ||
    env.VERCEL !== "1" ||
    env.VERCEL_ENV !== "preview" ||
    env.VERCEL_PROJECT_ID !== PROJECT_ID ||
    env.EMAIL_DELIVERY_DISABLED !== "true"
  )
    return false;
  try {
    const app = new URL(env.NEXTAUTH_URL),
      db = new URL(env.MONGODB_URI);
    return (
      app.protocol === "https:" &&
      app.hostname.endsWith(".vercel.app") &&
      !app.username &&
      !app.password &&
      db.protocol === "mongodb+srv:" &&
      db.pathname === "/panteralab_homologacao_vercel" &&
      db.hostname === env.PANTERALAB_PREVIEW_MONGODB_HOST &&
      db.hostname.endsWith(".mongodb.net") &&
      !db.searchParams
        .getAll("tls")
        .some((value) => ["false", "0"].includes(value.toLowerCase())) &&
      !db.searchParams
        .getAll("ssl")
        .some((value) => ["false", "0"].includes(value.toLowerCase()))
    );
  } catch {
    return false;
  }
}
export function isPreviewTestEmail(email) {
  return (
    typeof email === "string" && /^[a-z0-9._+-]+@panteralab\.test$/i.test(email)
  );
}
export function previewVerificationUrl(email, token, env = process.env) {
  if (
    !isPreviewRegistrationEnabled(env) ||
    !isPreviewTestEmail(email) ||
    !/^[a-f0-9]{64}$/i.test(token)
  )
    return null;
  const url = new URL("/verify", env.NEXTAUTH_URL);
  url.searchParams.set("token", token);
  return url.href;
}
