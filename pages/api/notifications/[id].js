import { withApi, requireCondition } from "@/lib/api";
import Notification from "@/lib/models/Notification";
import { isObjectId } from "@/lib/validation";

export default withApi(
  { methods: ["PATCH"], auth: true, scope: "notifications-read", limit: 60 },
  async (req, res, session) => {
    requireCondition(isObjectId(req.query.id), 400, "Identificador inválido.");
    const result = await Notification.updateOne(
      { _id: req.query.id, recipientId: session.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    requireCondition(result.matchedCount > 0, 404, "Notificação indisponível.");
    return res.status(200).json({ success: true });
  },
);
