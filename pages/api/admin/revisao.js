import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import ModerationLog from "@/lib/models/ModerationLog";
import { isObjectId, validText } from "@/lib/validation";
const models = { candle: Candle, message: Message, comment: Comment };
export default withApi(
  { methods: ["GET"], admin: true },
  async (req, res, session) => {
    const { type, id, reason } = req.query;
    requireCondition(
      Object.hasOwn(models, type) && isObjectId(id) && validText(reason, 500),
      400,
      "Informe o conteúdo e o motivo da revisão.",
    );
    // Fail closed: a private read cannot be returned without its audit entry.
    await ModerationLog.create({
      actorId: session.user.id,
      action: "review-content",
      targetType: type,
      targetId: id,
      reason,
    });
    const item = await models[type].findById(id).lean();
    requireCondition(item, 404, "Conteúdo não encontrado.");
    return res.status(200).json({
      item: {
        _id: item._id,
        content: item.intention || item.content,
        status: item.status,
        visibility: item.visibility || "community",
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
      },
    });
  },
);
