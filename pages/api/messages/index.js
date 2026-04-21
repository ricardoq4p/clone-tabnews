import connectToDatabase from "@/lib/db";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Pusher from "pusher";
import {
  generatePanteraReply,
  hasPanteraMention,
  PANTERA_PROFILE,
} from "@/lib/pantera-ai";
import { isSuperadminSession } from "@/lib/auth";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

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
  const communityName =
    plainMessage?.communityId?.name || plainMessage?.communityName || "";
  const communityId =
    typeof plainMessage?.communityId === "string"
      ? plainMessage.communityId
      : plainMessage?.communityId?._id?.toString() || null;

  return {
    ...plainMessage,
    author: authorName,
    avatar: authorAvatar,
    communityId,
    communityName,
  };
}

async function maybeReplyAsPantera({ message }) {
  if (!hasPanteraMention(message.content)) {
    return;
  }

  try {
    const replyText = await generatePanteraReply({
      authorName: message.author,
      message,
      comments: [],
      mentionSource: {
        type: "post",
        content: message.content,
      },
    });

    const panteraComment = await Comment.create({
      content: replyText,
      author: PANTERA_PROFILE.name,
      avatar: PANTERA_PROFILE.avatar,
      messageId: message._id.toString(),
    });

    await pusher.trigger("comments", "new-comment", panteraComment);
  } catch (err) {
    console.error("ERRO PANTERA POST:", err);
  }
}

export default async function handler(req, res) {
  console.log("API MESSAGES INDEX EXECUTANDO");

  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const session = await getServerSession(req, res, authOptions);
      const filters = {};

      if (req.query.communityId) {
        filters.communityId = req.query.communityId;
      }

      const messages = await Message.find(filters)
        .populate("userId", "name username avatar")
        .populate("communityId", "name privacy ownerId members")
        .sort({ createdAt: -1 });

      const visibleMessages = messages.filter((message) => {
        if (!message.communityId) {
          return true;
        }

        if (message.communityId.privacy !== "private") {
          return true;
        }

        if (!session?.user?.id) {
          return false;
        }

        if (message.communityId.ownerId?.toString() === session.user.id) {
          return true;
        }

        return message.communityId.members.some(
          (member) => member.toString() === session.user.id,
        );
      });

      return res.status(200).json(visibleMessages.map(normalizeMessage));
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

      const rateLimitResult = checkRateLimit({
        key: `messages:${session.user.id}:${getClientIp(req)}`,
        limit: Number(process.env.RATE_LIMIT_MESSAGES_MAX || 10),
        windowMs: Number(process.env.RATE_LIMIT_MESSAGES_WINDOW_MS || 60 * 1000),
      });

      if (!rateLimitResult.success) {
        return res.status(429).json({
          error: createRateLimitErrorMessage(
            "Muitas publicacoes em pouco tempo.",
            rateLimitResult.retryAfter,
          ),
        });
      }

      const { content, communityId } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Mensagem vazia" });
      }

      let targetCommunity = null;

      if (communityId) {
        targetCommunity = await Community.findById(communityId);

        if (!targetCommunity) {
          return res.status(404).json({ error: "Comunidade nao encontrada" });
        }

        const canPublish =
          targetCommunity.ownerId.toString() === session.user.id ||
          targetCommunity.members.some(
            (member) => member.toString() === session.user.id,
          );

        if (!canPublish) {
          return res
            .status(403)
            .json({ error: "Participe da comunidade antes de publicar" });
        }
      }

      const newMessage = new Message({
        content,
        userId: session.user.id,
        communityId: targetCommunity?._id || null,
      });

      await newMessage.save();

      const populatedMessage = await newMessage.populate([
        { path: "userId", select: "name username avatar" },
        { path: "communityId", select: "name" },
      ]);
      const normalizedMessage = normalizeMessage(populatedMessage);

      await pusher.trigger("feed", "new-message", normalizedMessage);
      await maybeReplyAsPantera({ message: normalizedMessage });

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

      const { id } = req.body?.id ? req.body : req.query;
      const message = await Message.findById(id);

      if (!message) {
        return res.status(404).json({ error: "Mensagem nao encontrada" });
      }

      const isSuperadmin = isSuperadminSession(session);
      const isAuthorById = message.userId?.toString?.() === session.user.id;
      const isAuthorByName =
        !message.userId && message.author && message.author === session.user.name;
      const canDelete = isSuperadmin || isAuthorById || isAuthorByName;

      if (!canDelete) {
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
