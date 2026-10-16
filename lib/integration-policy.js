// Credentials alone never activate unvalidated providers on a production deployment.
export function serverIntegrationEnabled(kind, env = process.env) {
  if (kind === "email" && env.EMAIL_DELIVERY_DISABLED === "true") return false;
  if (env.VERCEL_ENV !== "production") return true;
  const flags = {
    email: "PANTERALAB_EMAIL_ENABLED",
    ai: "PANTERALAB_AI_ENABLED",
    realtime: "NEXT_PUBLIC_REALTIME_ENABLED",
    uploads: "NEXT_PUBLIC_UPLOADS_ENABLED",
  };
  return Boolean(flags[kind] && env[flags[kind]] === "true");
}
export const uploadsEnabled =
  process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "true" ||
  (typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL_ENV !== "production" &&
    Boolean(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    ));
export const realtimeEnabled =
  process.env.NEXT_PUBLIC_REALTIME_ENABLED === "true";
export const EMAIL_UNAVAILABLE =
  "Cadastro e envio de emails de conta estão temporariamente indisponíveis. O login de contas existentes continua disponível.";

export function isProductionTestAccount(email, env = process.env) {
  return (
    env.VERCEL_ENV === "production" && /@panteralab\.test$/i.test(email || "")
  );
}
