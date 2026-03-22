import connectToDatabase from "../../../lib/db";
import Comment from "../../../lib/models/Comment";

export default async function handler(req, res) {
  await connectToDatabase();

  // 🔹 GET → buscar comentários
  if (req.method === "GET") {
    const { messageId } = req.query;

    const comments = await Comment.find({ messageId }).sort({ _id: -1 });
    return res.status(200).json(comments);
  }

  // 🔹 POST → criar comentário
  if (req.method === "POST") {
    const { content, author, messageId } = req.body;

    if (!content || !messageId) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const newComment = await Comment.create({
      content,
      author: author || "Anônimo",
      messageId,
      createdAt: new Date(),
    });

    return res.status(201).json(newComment);
  }

  return res.status(405).end();
}
