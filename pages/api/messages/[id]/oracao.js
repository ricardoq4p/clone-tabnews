import { withApi, requireCondition } from "@/lib/api";
import { readableMessage } from "@/lib/message-access";
import { recordPrayer } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
import { tryCreateNotification } from "@/lib/notifications";
import { notifyNotificationChange } from "@/lib/notification-realtime";
export default withApi(
  { methods: ["PUT"], auth: true, scope: "message-prayer", limit: 30 },
  async (req, res, session) => {
    requireCondition(isObjectId(req.query.id), 400, "Identificador inválido.");
    const parent = await readableMessage(req.query.id, session);
    requireCondition(parent, 404, "Publicação indisponível.");
    const result = await recordPrayer(
      "message",
      parent.message._id,
      session.user.id,
    );
    const recipient = parent.message.userId.toString();
    const actor = session.user.id;
    if (result.created && recipient !== actor) {
      await tryCreateNotification({
        recipientId: recipient,
        actorId: actor,
        type: "message_prayer",
        targetId: parent.message._id,
        dedupeKey: `message-prayer:${parent.message._id}:${actor}`,
      });
      await notifyNotificationChange(recipient);
    }
    return res.status(200).json(result);
  },
);
