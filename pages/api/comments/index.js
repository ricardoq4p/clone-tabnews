import connectToDatabase from "../../../lib/db";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar comentários
  if (req.method === "GET") {
    const { messageId } = req.query;

    const comments = await Comment.find({ messageId }).sort({ _id: -1 });
    return res.status(200).json(comments);
  }

  // 🔹 POST → criar comentário (PROTEGIDO)
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { content, messageId } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Comentário vazio" });
    }

    const newComment = await Comment.create({
      content,
      author: session.user.name,
      messageId,
      createdAt: new Date(),
    });

    return res.status(201).json(newComment);
  }

  // 🔥 fallback (OBRIGATÓRIO)
  return res.status(405).json({ error: "Método não permitido" });
}
