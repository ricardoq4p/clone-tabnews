// Vercel assigns an immutable URL per Preview. Configure it only for our isolated project.
export function configurePreviewOrigin(env = process.env) {
  if (
    env.VERCEL !== "1" ||
    env.VERCEL_ENV !== "preview" ||
    env.VERCEL_PROJECT_ID !== "prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe"
  )
    return false;
  const host = env.VERCEL_URL;
  if (!host || !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/i.test(host))
    throw new Error("URL de homologação Vercel inválida.");
  env.NEXTAUTH_URL = `https://${host}`;
  return true;
}
