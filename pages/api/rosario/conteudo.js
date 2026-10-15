import { DEFAULT_CONTENT } from "@/lib/rosary/content";
import { getRosaryContent } from "@/lib/rosary/editions";
import connectToDatabase from "@/lib/db";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido." });
  if (
    req.query.version &&
    (typeof req.query.version !== "string" || req.query.version.length > 80)
  )
    return res.status(400).json({ error: "Versão inválida." });
  try {
    if (process.env.MONGODB_URI) await connectToDatabase();
    return res
      .status(200)
      .json({ content: await getRosaryContent(req.query.version) });
  } catch (error) {
    if (!req.query.version)
      return res.status(200).json({ content: DEFAULT_CONTENT, fallback: true });
    return res.status(error.status || 503).json({
      error:
        "Não foi possível recuperar esta versão. Seu progresso foi preservado.",
    });
  }
}
