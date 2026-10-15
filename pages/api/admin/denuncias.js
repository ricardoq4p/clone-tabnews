import { withApi, requireCondition } from "@/lib/api";
import AbuseReport from "@/lib/models/AbuseReport";
import ModerationLog from "@/lib/models/ModerationLog";
import { isObjectId, validText } from "@/lib/validation";
export default withApi(
  {
    methods: ["GET", "PATCH"],
    admin: true,
    scope: "reports-review",
    limit: 30,
  },
  async (req, res, session) => {
    if (req.method === "GET") {
      requireCondition(
        !req.query.before || isObjectId(req.query.before),
        400,
        "Página inválida.",
      );
      const items = await AbuseReport.find({
        status: "pending",
        ...(req.query.before ? { _id: { $lt: req.query.before } } : {}),
      })
        .select("targetType targetId reason details status createdAt")
        .sort({ _id: -1 })
        .limit(21)
        .lean();
      return res.status(200).json({
        items: items.slice(0, 20),
        next: items.length > 20 ? items[19]._id : null,
      });
    }
    const { id, reason } = req.body || {};
    requireCondition(
      isObjectId(id) && validText(reason, 500),
      400,
      "Informe o motivo da conclusão.",
    );
    await ModerationLog.create({
      actorId: session.user.id,
      action: "resolve-report",
      targetType: "report",
      targetId: id,
      reason,
    });
    await AbuseReport.updateOne({ _id: id }, { $set: { status: "resolved" } });
    return res.status(200).json({ message: "Relato concluído." });
  },
);
