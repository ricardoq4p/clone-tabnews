import connectToDatabase from "../../../lib/db";
import Message from "../../../lib/models/Message";
import Comment from "../../../lib/models/Comment";

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar mensagens
  if (req.method === "GET") {
    const messages = await Message.find().sort({ _id: -1 });
    return res.status(200).json(messages);
  }

  // 🔹 POST → criar mensagem
  if (req.method === "POST") {
    const { content, author } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const newMessage = await Message.create({
      content,
      author: author || "Anônimo",
      createdAt: new Date(),
    });

    return res.status(201).json(newMessage);
  }

  // 🔹 DELETE → apagar com regra de permissão
  if (req.method === "DELETE") {
    const { id, user } = req.body;

    if (!id || !user) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Mensagem não encontrada" });
    }

    // 🔒 REGRA DE PERMISSÃO
    const isAuthor = message.author === user;
    const isAdmin = user === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Sem permissão para excluir" });
    }

    // 🗑️ remove mensagem
    await Message.findByIdAndDelete(id);

    // 🧹 remove comentários relacionados
    await Comment.deleteMany({ messageId: id });

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
