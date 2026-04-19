import connectToDatabase from "@/lib/db";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
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

function normalizeMessage(message) {
  const plainMessage = typeof message?.toObject === "function" ? message.toObject() : message;
  const authorName = plainMessage?.userId?.name || plainMessage?.author || "Usuario";
  const authorAvatar = plainMessage?.userId?.avatar || plainMessage?.avatar || "";

  return {
    ...plainMessage,
    author: authorName,
    avatar: authorAvatar,
  };
}

export default async function handler(req, res) {
  console.log("API MESSAGES INDEX EXECUTANDO");

  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const messages = await Message.find()
        .populate("userId", "name username avatar")
        .sort({ createdAt: -1 });

      return res.status(200).json(messages.map(normalizeMessage));
    } catch (err) {
      console.error("ERRO GET:", err);
      return res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Nao autenticado" });
      }

      const { content } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Mensagem vazia" });
      }

      const newMessage = new Message({
        content,
        userId: session.user.id,
      });

      await newMessage.save();

      const populatedMessage = await newMessage.populate("userId", "name username avatar");
      const normalizedMessage = normalizeMessage(populatedMessage);

      await pusher.trigger("feed", "new-message", normalizedMessage);

      return res.status(201).json(normalizedMessage);
    } catch (err) {
      console.error("ERRO POST:", err);
      return res.status(500).json({ error: "Erro ao criar mensagem" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Nao autenticado" });
      }

      const { id } = req.body;
      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({ error: "Mensagem nao encontrada" });
      }

      const isAuthor = message.userId.toString() === session.user.id;

      if (!isAuthor) {
        return res.status(403).json({ error: "Sem permissao" });
      }

      await Message.findByIdAndDelete(id);
      await Comment.deleteMany({ messageId: id });
      await pusher.trigger("feed", "delete-message", { id });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("ERRO DELETE:", err);
      return res.status(500).json({ error: "Erro ao deletar mensagem" });
    }
  }

  return res.status(405).json({ error: "Metodo nao permitido" });
}
