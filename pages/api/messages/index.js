import connectToDatabase from "../../../lib/db";
import Message from "../../../lib/models/Message";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Pusher from "pusher";
import User from "../../../lib/models/User";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET (mensagens)
  if (req.method === "GET") {
    try {
      const messages = await Message.find().sort({ _id: -1 });
      return res.status(200).json(messages);
    } catch {
      return res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  }

  // 🔹 POST (criar mensagem)
  // 🔹 POST (criar mensagem)
  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Mensagem vazia" });
      }

      // 🔥 BUSCA USUÁRIO REAL NO BANCO
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const newMessage = await Message.create({
        content,
        author: session.user.name,
        username: user.username, // 👈 CORRETO AGORA
        createdAt: new Date(),
      });

      // 🚀 realtime feed
      await pusher.trigger("feed", "new-message", newMessage);

      return res.status(201).json(newMessage);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar mensagem" });
    }
  }

  // 🔹 DELETE (mensagem)
  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { id } = req.body;

      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({ error: "Mensagem não encontrada" });
      }

      const isAuthor = message.author === session.user.name;

      if (!isAuthor) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      await Message.findByIdAndDelete(id);
      await Comment.deleteMany({ messageId: id });

      // 🚀 realtime delete
      await pusher.trigger("feed", "delete-message", { id });

      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao deletar mensagem" });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
