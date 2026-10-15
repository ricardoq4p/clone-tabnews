import { withApi, requireCondition } from "@/lib/api";
import Candle from "@/lib/models/Candle";
import User from "@/lib/models/User";
import {
  candleDates,
  activePublicFilter,
  candleView,
  VISIBILITIES,
  isCandleActive,
} from "@/lib/candles";
import { supportSummary } from "@/lib/prayer-support";
import { isObjectId, validText } from "@/lib/validation";
export default withApi(
  { methods: ["GET", "POST"], scope: "candles", limit: 5, windowMs: 900000 },
  async (req, res, session) => {
    const now = new Date();
    if (req.method === "GET") {
      requireCondition(
        !req.query.before || isObjectId(req.query.before),
        400,
        "Página inválida.",
      );
      const filter = activePublicFilter(now);
      if (req.query.before) filter._id = { $lt: req.query.before };
      const candles = await Candle.find(filter)
        .sort({ _id: -1 })
        .limit(21)
        .lean();
      const page = candles.slice(0, 20);
      const supports = await supportSummary(
        "candle",
        page.map((item) => item._id),
        session?.user?.id,
      );
      return res.status(200).json({
        items: page
          .filter((item) => isCandleActive(item, new Date()))
          .map((item) =>
            candleView(item, {
              now: new Date(),
              ...supports.get(item._id.toString()),
            }),
          ),
        next: candles.length > 20 ? page.at(-1)._id.toString() : null,
        serverNow: new Date().toISOString(),
      });
    }
    requireCondition(
      req.body?.accountId === session.user.id,
      401,
      "Sua conta mudou. Atualize a página antes de continuar.",
    );
    requireCondition(
      req.body?.privacyAccepted === true,
      400,
      "Confirme a leitura das informações de privacidade.",
    );
    const { intention, visibility } = req.body || {};
    requireCondition(
      validText(intention, 1200) && VISIBILITIES.includes(visibility),
      400,
      "Escreva uma intenção de até 1.200 caracteres e escolha sua privacidade.",
    );
    const user = await User.findById(session.user.id).select("name").lean();
    requireCondition(user, 401, "Conta indisponível.");
    const candle = await Candle.create({
      policyVersion: "2026-1",
      acceptedAt: now,
      ownerId: session.user.id,
      authorName: String(user.name || "Participante").slice(0, 100),
      intention: intention.trim(),
      visibility,
      ...candleDates(now),
    });
    return res.status(201).json({
      candle: candleView(candle, { owner: true, now }),
      serverNow: new Date().toISOString(),
    });
  },
);
