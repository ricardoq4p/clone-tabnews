import connectToDatabase from "../../../lib/db";
import Message from "../../../lib/models/Message";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Pusher from "pusher";

// 🚀 Configuração do Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar mensagens
  if (req.method === "GET") {
    try {
      const messages = await Message.find().sort({ _id: -1 });
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  }

  // 🔹 POST → criar mensagem (SEGURA + TEMPO REAL)
  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      // 🔒 bloqueia não autenticados
      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { content } = req.body;

      // 🔒 valida conteúdo
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Mensagem vazia" });
      }

      // 🔒 garante usuário válido
      const userName = session.user?.name;

      if (!userName) {
        return res.status(400).json({ error: "Usuário inválido" });
      }

      const newMessage = await Message.create({
        content,
        author: userName,
        createdAt: new Date(),
      });

      // 🚀 TEMPO REAL
      await pusher.trigger("feed", "new-message", newMessage);

      return res.status(201).json(newMessage);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar mensagem" });
    }
  }

  // 🔹 DELETE → apagar com permissão + tempo real
  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const user = session.user;
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "ID obrigatório" });
      }

      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({ error: "Mensagem não encontrada" });
      }

      // 🔒 regra de permissão
      const isAuthor = message.author === user.name;
      const isAdmin = user.role === "admin";

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: "Sem permissão" });
      }

      // 🗑️ remove mensagem
      await Message.findByIdAndDelete(id);

      // 🧹 remove comentários relacionados
      await Comment.deleteMany({ messageId: id });

      // 🚀 TEMPO REAL (agora correto)
      await pusher.trigger("feed", "delete-message", { id });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar mensagem" });
    }
  }

  // 🔥 fallback obrigatório
  return res.status(405).json({ error: "Método não permitido" });
}
