// No authentication bypass: only the SMTP destination changes in the isolated local stack.
export function localSmtpOptions(env = process.env) {
  if (env.PANTERALAB_LOCAL_SMTP !== "true") return null;
  let safe = false;
  try {
    const app = new URL(env.NEXTAUTH_URL);
    const db = new URL(env.MONGODB_URI);
    safe =
      env.PANTERALAB_HOMOLOGATION === "local" &&
      !env.VERCEL &&
      app.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(app.hostname) &&
      app.port === "3107" &&
      db.protocol === "mongodb:" &&
      db.hostname === "127.0.0.1" &&
      db.port === "27027" &&
      db.pathname === "/panteralab_homologacao";
  } catch {
    /* reject incomplete or remote configuration */
  }
  if (!safe)
    throw new Error("SMTP local exige ambiente de homologação local isolado.");
  return { host: "127.0.0.1", port: 1025, secure: false, ignoreTLS: true };
}
