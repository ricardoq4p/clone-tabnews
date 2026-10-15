import { withApi, requireCondition } from "@/lib/api";
import PrivacyRequest from "@/lib/models/PrivacyRequest";
import ModerationLog from "@/lib/models/ModerationLog";
import { isObjectId, validText } from "@/lib/validation";
export default withApi(
  {
    methods: ["GET", "PATCH"],
    admin: true,
    scope: "privacy-review",
    limit: 20,
  },
  async (req, res, session) => {
    if (req.method === "GET") {
      requireCondition(
        !req.query.before || isObjectId(req.query.before),
        400,
        "Página inválida.",
      );
      const items = await PrivacyRequest.find({
        status: "pending",
        ...(req.query.before ? { _id: { $lt: req.query.before } } : {}),
      })
        .populate("userId", "email name")
        .sort({ _id: -1 })
        .limit(21)
        .lean();
      return res.status(200).json({
        items: items.slice(0, 20).map((item) => ({
          _id: item._id,
          kind: item.kind,
          details: item.details,
          name: item.userId?.name || "Conta indisponível",
          email: item.userId?.email || "",
          createdAt: item.createdAt,
        })),
        next: items.length > 20 ? items[19]._id : null,
      });
    }
    const { id, reason } = req.body || {};
    requireCondition(
      isObjectId(id) && validText(reason, 500),
      400,
      "Informe como a solicitação foi atendida.",
    );
    await ModerationLog.create({
      actorId: session.user.id,
      action: "privacy-request-resolved",
      targetType: "privacy",
      targetId: id,
      reason,
    });
    await PrivacyRequest.updateOne(
      { _id: id },
      { $set: { status: "resolved" } },
    );
    return res.status(200).json({
      message:
        "Atendimento registrado. A operação não exclui dados automaticamente.",
    });
  },
);
