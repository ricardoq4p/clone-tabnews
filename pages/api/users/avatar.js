import { rejectCrossOriginMutation } from "@/lib/api-security";
import { validImageUrl } from "@/lib/validation";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  await connectToDatabase();

  // 🔹 POST → salvar avatar (URL do Cloudinary)
  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { avatar } = req.body;

      if (!validImageUrl(avatar)) {
        return res.status(400).json({ error: "Avatar inválido" });
      }

      // 🔥 atualiza usuário logado
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        { avatar },
        { returnDocument: "after" },
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({
        message: "Avatar atualizado com sucesso",
        avatar: updatedUser.avatar,
      });
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
