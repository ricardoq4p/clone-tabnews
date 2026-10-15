import { withApi, requireCondition } from "@/lib/api";
import RosaryProgress from "@/lib/models/RosaryProgress";
import { getRosaryContent } from "@/lib/rosary/editions";
import { validProgress, buildRosary } from "@/lib/rosary/engine";
function view(item) {
  if (!item) return null;
  return {
    version: item.version,
    setId: item.setId,
    full: item.full,
    fatima: item.fatima,
    position: item.position,
    updatedAt: item.updatedAt,
  };
}
export default withApi(
  { methods: ["GET", "PUT"], auth: true, scope: "rosary-progress", limit: 120 },
  async (req, res, session) => {
    if (req.method === "GET") {
      const item = await RosaryProgress.findOne({
        userId: session.user.id,
      }).lean();
      return res.status(200).json({
        progress: view(item),
        revision: item?.revision || 0,
        ...(item ? { content: await getRosaryContent(item.version) } : {}),
      });
    }
    requireCondition(
      req.body?.accountId === session.user.id,
      401,
      "Sua conta mudou. Atualize a página antes de continuar.",
    );
    const { progress, expectedRevision } = req.body || {};
    requireCondition(
      Number.isSafeInteger(expectedRevision) &&
        expectedRevision >= 0 &&
        typeof progress?.version === "string" &&
        progress.version.length <= 80,
      400,
      "Progresso inválido.",
    );
    const content = await getRosaryContent(progress.version);
    requireCondition(
      validProgress(progress, content),
      400,
      "Progresso inválido.",
    );
    const data = {
      completed:
        progress.position ===
        buildRosary(progress.setId, progress, content).length,
      version: progress.version,
      setId: progress.setId,
      full: progress.full,
      fatima: progress.fatima,
      position: progress.position,
    };
    await RosaryProgress.init();
    let saved;
    if (expectedRevision === 0) {
      try {
        saved = await RosaryProgress.create({
          userId: session.user.id,
          ...data,
          revision: 1,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    } else
      saved = await RosaryProgress.findOneAndUpdate(
        { userId: session.user.id, revision: expectedRevision },
        { $set: data, $inc: { revision: 1 } },
        { returnDocument: "after" },
      );
    if (!saved) {
      const item = await RosaryProgress.findOne({
        userId: session.user.id,
      }).lean();
      return res.status(409).json({
        error:
          "Há uma oração salva em outro dispositivo. Escolha qual continuar.",
        progress: view(item),
        revision: item?.revision || 0,
        ...(item ? { content: await getRosaryContent(item.version) } : {}),
      });
    }
    return res
      .status(200)
      .json({ progress: view(saved), revision: saved.revision });
  },
);
