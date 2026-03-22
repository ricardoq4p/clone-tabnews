import connectToDatabase from "../../../lib/db";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET
  if (req.method === "GET") {
    try {
      const { messageId } = req.query;

      if (!messageId) {
        return res.status(200).json([]);
      }

      const comments = await Comment.find({ messageId }).sort({ _id: -1 });

      return res.status(200).json(comments || []);
    } catch (err) {
      console.error("Erro ao buscar comentários:", err);
      return res.status(200).json([]);
    }
  }

  // 🔹 POST
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

      // 🚀 REALTIME (FALTAVA ISSO)
      await pusher.trigger("comments", "new-comment", newComment);

      return res.status(201).json(newComment);
    } catch (err) {
      console.error("Erro ao criar comentário:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  // 🔹 DELETE (opcional mas recomendado)
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      await Comment.findByIdAndDelete(id);

      // 🚀 REALTIME delete
      await pusher.trigger("comments", "delete-comment", { id });

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao deletar comentário" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
