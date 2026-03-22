import connectToDatabase from "../../../lib/db";
import Message from "../../../lib/models/Message";
import Comment from "../../../lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar mensagens
  if (req.method === "GET") {
    const messages = await Message.find().sort({ _id: -1 });
    return res.status(200).json(messages);
  }

  // 🔹 POST → criar mensagem (SEGURA)
  if (req.method === "POST") {
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
      author: userName, // 🔥 sempre autenticado
      createdAt: new Date(),
    });

    return res.status(201).json(newMessage);
  }

  // 🔹 DELETE → apagar com permissão
  if (req.method === "DELETE") {
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
    const isAdmin = user.role === "admin"; // futuro

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    // 🗑️ remove mensagem
    await Message.findByIdAndDelete(id);

    // 🧹 remove comentários relacionados
    await Comment.deleteMany({ messageId: id });

    return res.status(200).json({ success: true });
  }

  // 🔥 fallback obrigatório
  return res.status(405).json({ error: "Método não permitido" });
}
