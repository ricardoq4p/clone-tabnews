import { withApi, requireCondition } from "@/lib/api";
import ModerationLog from "@/lib/models/ModerationLog";
import { isObjectId } from "@/lib/validation";
export default withApi({ methods: ["GET"], admin: true }, async (req, res) => {
  requireCondition(
    !req.query.before || isObjectId(req.query.before),
    400,
    "Página inválida.",
  );
  const items = await ModerationLog.find(
    req.query.before ? { _id: { $lt: req.query.before } } : {},
  )
    .select("action targetType targetId reason createdAt")
    .sort({ _id: -1 })
    .limit(21)
    .lean();
  return res.status(200).json({
    items: items.slice(0, 20),
    next: items.length > 20 ? items[19]._id : null,
  });
});
