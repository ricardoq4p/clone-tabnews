import { withApi, requireCondition } from "@/lib/api";
import Message from "@/lib/models/Message";
import Comment from "@/lib/models/Comment";
import { isObjectId } from "@/lib/validation";
export default withApi({ methods: ["GET"], admin: true }, async (req, res) => {
  requireCondition(
    ["message", "comment"].includes(req.query.type) &&
      (!req.query.before || isObjectId(req.query.before)),
    400,
    "Filtro inválido.",
  );
  const model = req.query.type === "comment" ? Comment : Message;
  const items = await model
    .find(req.query.before ? { _id: { $lt: req.query.before } } : {})
    .select("status category createdAt")
    .sort({ _id: -1 })
    .limit(21)
    .lean();
  return res.status(200).json({
    items: items.slice(0, 20),
    next: items.length > 20 ? items[19]._id : null,
  });
});
