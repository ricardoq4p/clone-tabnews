import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  await connectToDatabase();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // 🔥 retorno padronizado
    return res.status(200).json({
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar || null, // 🔥 GARANTE CONSISTÊNCIA
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
}
