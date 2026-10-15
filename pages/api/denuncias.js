import { withApi, requireCondition } from "@/lib/api";
import AbuseReport from "@/lib/models/AbuseReport";
import Candle from "@/lib/models/Candle";
import Comment from "@/lib/models/Comment";
import { readableMessage } from "@/lib/message-access";
import { canReadCandle } from "@/lib/candles";
import { isObjectId } from "@/lib/validation";
export default withApi(
  {
    methods: ["POST"],
    auth: true,
    scope: "reports",
    limit: 5,
    windowMs: 900000,
  },
  async (req, res, session) => {
    const { targetType, targetId, reason, details = "" } = req.body || {};
    requireCondition(
      ["candle", "message", "comment"].includes(targetType) &&
        isObjectId(targetId) &&
        ["privacy", "disrespect", "spam", "other"].includes(reason) &&
        typeof details === "string" &&
        details.length <= 500,
      400,
      "Confira os dados do relato.",
    );
    let readable;
    if (targetType === "candle")
      readable = canReadCandle(
        await Candle.findById(targetId).lean(),
        session.user.id,
      );
    else if (targetType === "message")
      readable = await readableMessage(targetId, session);
    else {
      const comment = await Comment.findById(targetId).lean();
      readable =
        comment &&
        comment.status !== "hidden" &&
        (await readableMessage(comment.messageId, session));
    }
    requireCondition(readable, 404, "Conteúdo indisponível.");
    await AbuseReport.init();
    try {
      await AbuseReport.create({
        reporterId: session.user.id,
        targetType,
        targetId,
        reason,
        details: details.trim(),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    return res.status(200).json({
      message:
        "Recebemos seu relato. A administração poderá revisá-lo com cuidado.",
    });
  },
);
