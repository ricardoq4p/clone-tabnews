import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import { isObjectId } from "@/lib/validation";
export default withApi({ methods: ["GET"], admin: true }, async (req, res) => {
  requireCondition(
    !req.query.before || isObjectId(req.query.before),
    400,
    "Página inválida.",
  );
  const filter = req.query.before ? { _id: { $lt: req.query.before } } : {};
  // No intention or author in the moderation list, even for administrators.
  const items = await Candle.find(filter)
    .select("visibility status createdAt expiresAt")
    .sort({ _id: -1 })
    .limit(21)
    .lean();
  return res.status(200).json({
    items: items.slice(0, 20),
    next: items.length > 20 ? items[19]._id : null,
    serverNow: new Date().toISOString(),
  });
});
