import { withApi, requireCondition } from "@/lib/api";
import User from "@/lib/models/User";
import ModerationLog from "@/lib/models/ModerationLog";
import { isObjectId, validText } from "@/lib/validation";
export default withApi(
  { methods: ["GET", "PATCH"], admin: true, scope: "participants", limit: 20 },
  async (req, res, session) => {
    if (req.method === "GET") {
      requireCondition(
        !req.query.before || isObjectId(req.query.before),
        400,
        "Página inválida.",
      );
      const items = await User.find(
        req.query.before ? { _id: { $lt: req.query.before } } : {},
      )
        .select("name email role isVerified disabledAt createdAt")
        .sort({ _id: -1 })
        .limit(21)
        .lean();
      return res.status(200).json({
        items: items.slice(0, 20),
        next: items.length > 20 ? items[19]._id : null,
      });
    }
    const { id, action, reason } = req.body || {};
    requireCondition(
      isObjectId(id) &&
        ["disable", "enable"].includes(action) &&
        validText(reason, 500),
      400,
      "Dados inválidos.",
    );
    requireCondition(
      id !== session.user.id,
      400,
      "Você não pode suspender a própria conta por este painel.",
    );
    await ModerationLog.create({
      actorId: session.user.id,
      action: `${action}-user`,
      targetType: "user",
      targetId: id,
      reason,
    });
    const result = await User.updateOne(
      { _id: id },
      {
        $set: { disabledAt: action === "disable" ? new Date() : null },
        $inc: { sessionVersion: 1 },
      },
    );
    requireCondition(result.matchedCount, 404, "Conta não encontrada.");
    return res.status(200).json({
      message: "Conta atualizada. As sessões anteriores foram revogadas.",
    });
  },
);
