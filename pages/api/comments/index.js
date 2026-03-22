import connectToDatabase from "../../../lib/db";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar comentários
  if (req.method === "GET") {
    try {
      const { messageId } = req.query;

      // 🔒 proteção
      if (!messageId) {
        return res.status(200).json([]); // SEMPRE array
      }

      const comments = await Comment.find({ messageId }).sort({ _id: -1 });

      return res.status(200).json(comments || []);
    } catch (err) {
      console.error("Erro ao buscar comentários:", err);
      return res.status(200).json([]); // nunca quebra o front
    }
  }

  // 🔹 POST → criar comentário (PROTEGIDO)
  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { content, messageId } = req.body;

      if (!content || !messageId) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const newComment = await Comment.create({
        content,
        author: session.user.name,
        messageId,
        createdAt: new Date(),
      });

      return res.status(201).json(newComment);
    } catch (err) {
      console.error("Erro ao criar comentário:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  // 🔥 fallback
  return res.status(405).json({ error: "Método não permitido" });
}
