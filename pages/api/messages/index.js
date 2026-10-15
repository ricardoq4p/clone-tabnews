import { rejectCrossOriginMutation } from "@/lib/api-security";
import connectToDatabase from "@/lib/db";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { notifyChange } from "@/lib/pusher";
import { maybeReplyAsPantera } from "@/lib/pantera-comments";
import { canDeleteContent, isMember } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isObjectId, validText } from "@/lib/validation";

function normalizeMessage(message) {
  return {
    _id: message._id,
    content: message.content,
    createdAt: message.createdAt,
    userId: message.userId,
    author: message.userId?.name || "Usuario",
    avatar: message.userId?.avatar || "",
    communityId: message.communityId?._id?.toString() || null,
    communityName: message.communityId?.name || "",
  };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (!["GET", "POST", "DELETE"].includes(req.method))
    return res.status(405).json({ error: "Metodo nao permitido" });
  try {
    const session = await getServerSession(req, res, authOptions);
    await connectToDatabase();
    if (req.method === "GET") {
      const { communityId, before } = req.query;
      if (
        (communityId && !isObjectId(communityId)) ||
        (before && !isObjectId(before))
      )
        return res.status(400).json({ error: "Filtro invalido" });
      const allowed = await Community.find({
        deletedAt: null,
        $or: [
          { privacy: "public" },
          ...(session?.user?.id
            ? [{ ownerId: session.user.id }, { members: session.user.id }]
            : []),
        ],
      })
        .select("_id")
        .lean();
      const allowedIds = allowed.map((community) => community._id);
      if (
        communityId &&
        !allowedIds.some((id) => id.toString() === communityId)
      )
        return res.status(404).json({ error: "Comunidade indisponivel" });
      const filters = communityId
        ? { communityId }
        : {
            $or: [{ communityId: null }, { communityId: { $in: allowedIds } }],
          };
      if (before) filters._id = { $lt: before };
      const messages = await Message.find(filters)
        .populate("userId", "name username avatar")
        .populate("communityId", "name")
        .sort({ _id: -1 })
        .limit(50);
      return res.status(200).json(messages.map(normalizeMessage));
    }
    if (!session) return res.status(401).json({ error: "Nao autenticado" });
    if (req.method === "POST") {
      const rate = await checkRateLimit({
        key: `messages:${session.user.id}:${getClientIp(req)}`,
        ip: getClientIp(req),
        identity: session.user.id,
        limit: Number(process.env.RATE_LIMIT_MESSAGES_MAX || 10),
        windowMs: Number(process.env.RATE_LIMIT_MESSAGES_WINDOW_MS || 60000),
      });
      if (!rate.success)
        return res
          .status(429)
          .json({ error: "Muitas publicacoes em pouco tempo." });
      const { content, communityId } = req.body || {};
      if (!validText(content) || (communityId && !isObjectId(communityId)))
        return res.status(400).json({ error: "Dados invalidos" });
      if (communityId) {
        const community = await Community.findById(communityId);
        if (!isMember(community, session.user.id))
          return res
            .status(403)
            .json({ error: "Participe da comunidade antes de publicar" });
      }
      const message = await Message.create({
        content: content.trim(),
        userId: session.user.id,
        communityId: communityId || null,
      });
      await message.populate([
        { path: "userId", select: "name username avatar" },
        { path: "communityId", select: "name" },
      ]);
      const result = normalizeMessage(message);
      await notifyChange("feed", "new-message", communityId);
      await maybeReplyAsPantera({
        message: result,
        authorName: session.user.name,
        communityId,
      });
      return res.status(201).json(result);
    }
    const id = req.body?.id || req.query.id;
    if (!isObjectId(id))
      return res.status(400).json({ error: "Identificador invalido" });
    const message = await Message.findById(id);
    if (!message)
      return res.status(404).json({ error: "Mensagem nao encontrada" });
    if (!canDeleteContent(message, session))
      return res.status(403).json({ error: "Sem permissao" });
    await Message.findByIdAndDelete(id);
    await Comment.deleteMany({ messageId: id });
    await notifyChange(
      "feed",
      "delete-message",
      message.communityId?.toString(),
    );
    return res.status(200).json({ success: true });
  } catch {
    return res
      .status(500)
      .json({ error: "Nao foi possivel concluir a operacao" });
  }
}
