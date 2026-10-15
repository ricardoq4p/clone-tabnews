import { configurePreviewOrigin } from "./preview-origin";
// NextAuth protects its own endpoints. This guard covers custom API routes.
export function rejectCrossOriginMutation(req, res) {
  configurePreviewOrigin();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return false;
  const origin = req.headers?.origin;
  let rejected = req.headers?.["sec-fetch-site"] === "cross-site";
  if (origin) {
    try {
      const expected = new URL(
        process.env.NEXTAUTH_URL || `http://${req.headers.host}`,
      ).origin;
      rejected ||= new URL(origin).origin !== expected;
    } catch {
      rejected = true;
    }
  }
  if (rejected) res.status(403).json({ error: "Origem nao permitida" });
  return rejected;
}
