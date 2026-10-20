import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import { isCandleActive, canReadCandle } from "@/lib/candles";
import { recordPrayer } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
import { tryCreateNotification } from "@/lib/notifications";
import { notifyNotificationChange } from "@/lib/notification-realtime";
export default withApi(
  { methods: ["PUT"], auth: true, scope: "candle-prayer", limit: 30 },
  async (req, res, session) => {
    requireCondition(isObjectId(req.query.id), 400, "Identificador inválido.");
    const candle = await Candle.findById(req.query.id).lean();
    const now = new Date();
    requireCondition(
      canReadCandle(candle, session.user.id, now) &&
        isCandleActive(candle, now),
      404,
      "Esta intenção não está disponível.",
    );
    const result = await recordPrayer("candle", candle._id, session.user.id);
    if (result.created && candle.visibility === "public") {
      const recipient = candle.ownerId.toString();
      const actor = session.user.id;
      if (recipient !== actor) {
        await tryCreateNotification({
          recipientId: recipient,
          actorId: actor,
          type: "candle_prayer",
          targetId: candle._id,
          dedupeKey: `candle-prayer:${candle._id}:${actor}`,
        });
        await notifyNotificationChange(recipient);
      }
    }
    return res.status(200).json(result);
  },
);
