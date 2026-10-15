import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import { candleView, canReadCandle, VISIBILITIES } from "@/lib/candles";
import { idOf } from "@/lib/permissions";
import { supportSummary } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
export default withApi(
  { methods: ["GET", "PATCH"], scope: "candle-update", limit: 15 },
  async (req, res, session) => {
    requireCondition(isObjectId(req.query.id), 400, "Identificador inválido.");
    let candle = await Candle.findById(req.query.id).lean();
    const now = new Date();
    requireCondition(
      canReadCandle(candle, session?.user?.id, now),
      404,
      "Esta intenção não está disponível.",
    );
    const owner = idOf(candle.ownerId) === session?.user?.id;
    if (req.method === "PATCH") {
      requireCondition(owner, 403, "Somente o autor pode alterar esta vela.");
      const { action, visibility } = req.body || {};
      requireCondition(
        action === "withdraw" ||
          (action === "privacy" && VISIBILITIES.includes(visibility)),
        400,
        "Alteração inválida.",
      );
      const update =
        action === "withdraw" ? { status: "withdrawn" } : { visibility };
      candle = await Candle.findOneAndUpdate(
        { _id: candle._id, ownerId: session.user.id },
        { $set: update },
        { new: true },
      ).lean();
    }
    const summary = await supportSummary(
      "candle",
      [candle._id],
      session?.user?.id,
    );
    requireCondition(
      canReadCandle(candle, session?.user?.id, new Date()),
      404,
      "Esta intenção não está disponível.",
    );
    return res.status(200).json({
      candle: candleView(candle, {
        owner,
        now,
        ...summary.get(idOf(candle)),
      }),
      serverNow: new Date().toISOString(),
    });
  },
);
