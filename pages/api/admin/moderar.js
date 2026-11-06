import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import BlogPost from "@/lib/models/BlogPost";
import ModerationLog from "@/lib/models/ModerationLog";
import AbuseReport from "@/lib/models/AbuseReport";
import { isObjectId, validText } from "@/lib/validation";
import { notifyChange } from "@/lib/pusher";
const models = {
  candle: Candle,
  message: Message,
  comment: Comment,
  blog_post: BlogPost,
};
export default withApi(
  { methods: ["PATCH"], admin: true, scope: "moderation", limit: 30 },
  async (req, res, session) => {
    const { type, id, action, reason } = req.body || {};
    requireCondition(
      Object.hasOwn(models, type) &&
        isObjectId(id) &&
        ["hide", "restore"].includes(action) &&
        validText(reason, 500),
      400,
      "Informe a ação e o motivo da moderação.",
    );
    const record = await models[type]
      .findById(id)
      .select("status communityId messageId")
      .lean();
    requireCondition(record, 404, "Conteúdo não encontrado.");
    requireCondition(
      !(type === "candle" && record.status === "withdrawn"),
      409,
      "Uma vela retirada pelo autor não pode ser reativada pela moderação.",
    );
    requireCondition(
      !(type === "blog_post" && record.status === "draft"),
      409,
      "Um rascunho privado do autor não pode ser alterado pela moderação.",
    );
    await ModerationLog.create({
      actorId: session.user.id,
      action: `${action}-requested`,
      targetType: type,
      targetId: id,
      reason: reason.trim(),
    });
    const status =
      action === "hide" ? "hidden" : type === "candle" ? "active" : "published";
    const filter = {
      _id: id,
      ...(type === "candle" ? { status: { $ne: "withdrawn" } } : {}),
    };
    await models[type].updateOne(filter, { $set: { status } });
    await AbuseReport.updateMany(
      { targetType: type, targetId: id },
      { $set: { status: "resolved" } },
    );
    if (type === "message" || type === "comment") {
      const parent =
        type === "message"
          ? record
          : await Message.findById(record.messageId)
              .select("communityId")
              .lean();
      if (parent)
        await notifyChange(
          type === "message" ? "feed" : "comments",
          type === "message" ? "delete-message" : "delete-comment",
          parent.communityId?.toString(),
        );
    }
    return res.status(200).json({
      message:
        "Moderação registrada. O conteúdo foi atualizado sem exclusão de dados.",
    });
  },
);
