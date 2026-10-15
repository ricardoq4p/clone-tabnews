import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import { isCandleActive, canReadCandle } from "@/lib/candles";
import { recordPrayer } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
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
    return res
      .status(200)
      .json(await recordPrayer("candle", candle._id, session.user.id));
  },
);
