import { rejectCrossOriginMutation } from "@/lib/api-security";
import connectToDatabase from "@/lib/db";
import Comment from "@/lib/models/Comment";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { readableMessage } from "@/lib/message-access";
import { canDeleteContent } from "@/lib/permissions";
import { notifyChange } from "@/lib/pusher";
import { maybeReplyAsPantera } from "@/lib/pantera-comments";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { isObjectId, validText } from "@/lib/validation";
function normalizeComment(comment) {
  const value = comment.toObject();
  return {
    ...value,
    author: value.userId?.name || value.author || "Usuario",
    avatar: value.userId?.avatar || value.avatar || "",
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
      const { messageId, before } = req.query;
      if (!messageId) return res.status(200).json([]);
      if (!isObjectId(messageId) || (before && !isObjectId(before)))
        return res.status(400).json({ error: "Identificador invalido" });
      if (!(await readableMessage(messageId, session)))
        return res.status(404).json({ error: "Publicacao indisponivel" });
      const filter = { messageId, ...(before ? { _id: { $lt: before } } : {}) };
      const comments = await Comment.find(filter)
        .populate("userId", "name avatar")
        .sort({ _id: -1 })
        .limit(50);
      return res.status(200).json(comments.map(normalizeComment));
    }
    if (!session) return res.status(401).json({ error: "Nao autenticado" });
    if (req.method === "POST") {
      const { content, messageId } = req.body || {};
      if (!validText(content) || !isObjectId(messageId))
        return res.status(400).json({ error: "Dados invalidos" });
      const parent = await readableMessage(messageId, session);
      if (!parent)
        return res.status(404).json({ error: "Publicacao indisponivel" });
      const rate = await checkRateLimit({
        key: `comments:${session.user.id}:${getClientIp(req)}`,
        ip: getClientIp(req),
        identity: session.user.id,
        limit: Number(process.env.RATE_LIMIT_COMMENTS_MAX || 20),
        windowMs: Number(process.env.RATE_LIMIT_COMMENTS_WINDOW_MS || 60000),
      });
      if (!rate.success)
        return res
          .status(429)
          .json({ error: "Muitos comentarios em pouco tempo." });
      const user = await User.findById(session.user.id).select("name avatar");
      if (!user) return res.status(401).json({ error: "Conta indisponivel" });
      const comment = await Comment.create({
        content: content.trim(),
        messageId,
        userId: user._id,
        author: user.name,
        avatar: user.avatar || "",
      });
      await comment.populate("userId", "name avatar");
      const result = normalizeComment(comment);
      const communityId = parent.message.communityId?.toString();
      await notifyChange("comments", "new-comment", communityId);
      await maybeReplyAsPantera({
        comment: result,
        authorName: user.name,
        communityId,
      });
      return res.status(201).json(result);
    }
    const id = req.body?.id || req.query.id;
    if (!isObjectId(id))
      return res.status(400).json({ error: "Identificador invalido" });
    const comment = await Comment.findById(id);
    if (!comment)
      return res.status(404).json({ error: "Comentario nao encontrado" });
    if (!canDeleteContent(comment, session))
      return res.status(403).json({ error: "Sem permissao" });
    const parent = await readableMessage(comment.messageId, session);
    await Comment.findByIdAndDelete(id);
    // An inaccessible/orphaned thread never generates a public event.
    if (parent)
      await notifyChange(
        "comments",
        "delete-comment",
        parent.message.communityId?.toString(),
      );
    return res.status(200).json({ success: true });
  } catch {
    return res
      .status(500)
      .json({ error: "Nao foi possivel concluir a operacao" });
  }
}
