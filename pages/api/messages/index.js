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

  // 🔹 POST → criar mensagem
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = session.user;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const newMessage = await Message.create({
      content,
      author: user.name || "Anônimo",
      createdAt: new Date(),
    });

    return res.status(201).json(newMessage);
  }

  // 🔹 DELETE → apagar com segurança real
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

    // 🔒 REGRA DE PERMISSÃO REAL
    const isAuthor = message.author === user.name;
    const isAdmin = user.role === "admin"; // futuramente

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    await Message.findByIdAndDelete(id);
    await Comment.deleteMany({ messageId: id });

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
