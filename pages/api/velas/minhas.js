import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import { candleView } from "@/lib/candles";
import { supportSummary } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
export default withApi(
  { methods: ["GET"], auth: true },
  async (req, res, session) => {
    requireCondition(
      !req.query.before || isObjectId(req.query.before),
      400,
      "Página inválida.",
    );
    const filter = {
      ownerId: session.user.id,
      ...(req.query.before ? { _id: { $lt: req.query.before } } : {}),
    };
    const candles = await Candle.find(filter)
      .sort({ _id: -1 })
      .limit(21)
      .lean();
    const page = candles.slice(0, 20);
    const now = new Date();
    const supports = await supportSummary(
      "candle",
      page.map((item) => item._id),
      session.user.id,
    );
    return res.status(200).json({
      items: page.map((item) =>
        candleView(item, {
          owner: true,
          now,
          ...supports.get(item._id.toString()),
        }),
      ),
      next: candles.length > 20 ? page.at(-1)._id.toString() : null,
      serverNow: new Date().toISOString(),
    });
  },
);
