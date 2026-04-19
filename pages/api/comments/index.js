import connectToDatabase from "@/lib/db";
import Comment from "@/lib/models/Comment";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Pusher from "pusher";
import {
  generatePanteraReply,
  hasPanteraMention,
  PANTERA_PROFILE,
} from "@/lib/pantera-ai";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

function normalizeComment(comment) {
  const plainComment = typeof comment?.toObject === "function" ? comment.toObject() : comment;
  const authorName = plainComment?.userId?.name || plainComment?.author || "Usuario";
  const authorAvatar = plainComment?.userId?.avatar || plainComment?.avatar || "";

  return {
    ...plainComment,
    author: authorName,
    avatar: authorAvatar,
  };
}

async function maybeReplyAsPantera({ comment, authorName }) {
  if (!hasPanteraMention(comment.content)) {
    return;
  }

  try {
    const [message, threadComments] = await Promise.all([
      Message.findById(comment.messageId)
        .populate("userId", "name avatar")
        .lean(),
      Comment.find({ messageId: comment.messageId }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    if (!message) {
      return;
    }

    const normalizedMessage = {
      ...message,
      author: message?.userId?.name || message?.author || "Usuario",
    };

    const normalizedThreadComments = threadComments.map((item) => ({
      ...item,
      author: item.author || "Usuario",
    }));

    const replyText = await generatePanteraReply({
      authorName,
      message: normalizedMessage,
      comments: normalizedThreadComments,
      mentionSource: {
        type: "comment",
        content: comment.content,
      },
    });

    const panteraComment = await Comment.create({
      content: replyText,
      author: PANTERA_PROFILE.name,
      avatar: PANTERA_PROFILE.avatar,
      messageId: comment.messageId,
    });

    await pusher.trigger("comments", "new-comment", panteraComment);
  } catch (err) {
    console.error("ERRO PANTERA COMMENT:", err);
  }
}

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const { messageId } = req.query;

      if (!messageId) {
        return res.status(200).json([]);
      }

      const comments = await Comment.find({ messageId })
        .populate("userId", "name avatar")
        .sort({ createdAt: -1 });

      return res.status(200).json(comments.map(normalizeComment));
    } catch (err) {
      console.error("Erro ao buscar comentarios:", err);
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Nao autenticado" });
      }

      const { content, messageId } = req.body;

      if (!content?.trim() || !messageId) {
        return res.status(400).json({ error: "Dados invalidos" });
      }

      const currentUser = await User.findOne({ email: session.user.email }).select("_id name avatar");
      const authorName = currentUser?.name || session.user.name || "Usuario";
      const newComment = await Comment.create({
        content: content.trim(),
        author: authorName,
        avatar: currentUser?.avatar || "",
        userId: currentUser?._id,
        messageId,
      });

      const populatedComment = await newComment.populate("userId", "name avatar");
      const normalizedComment = normalizeComment(populatedComment);

      await pusher.trigger("comments", "new-comment", normalizedComment);
      await maybeReplyAsPantera({ comment: normalizedComment, authorName });

      return res.status(201).json(normalizedComment);
    } catch (err) {
      console.error("Erro ao criar comentario:", err);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Nao autenticado" });
      }

      const { id } = req.body;
      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(404).json({ error: "Comentario nao encontrado" });
      }

      const isAuthorById = comment.userId?.toString() === session.user.id;
      const isAuthorByName = !comment.userId && comment.author === session.user.name;

      if (!isAuthorById && !isAuthorByName) {
        return res.status(403).json({ error: "Sem permissao" });
      }

      await Comment.findByIdAndDelete(id);
      await pusher.trigger("comments", "delete-comment", { id, messageId: comment.messageId });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Erro ao deletar comentario:", err);
      return res.status(500).json({ error: "Erro ao deletar comentario" });
    }
  }

  return res.status(405).json({ error: "Metodo nao permitido" });
}
