import { rejectCrossOriginMutation } from "@/lib/api-security";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  await connectToDatabase();

  const { username } = req.query;
  if (typeof username !== "string" || !username || username.length > 254)
    return res.status(400).json({ error: "Identificador inválido" });

  try {
    const user = await User.findOne({ username }).select(
      "username name avatar createdAt",
    );

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
}
