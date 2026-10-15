import { withApi, requireCondition } from "@/lib/api";
import { getRosaryContent, prepareEdition } from "@/lib/rosary/editions";
import RosaryEdition from "@/lib/models/RosaryEdition";
import ModerationLog from "@/lib/models/ModerationLog";
import { validText } from "@/lib/validation";
export default withApi(
  {
    methods: ["GET", "POST"],
    admin: true,
    scope: "rosary-editor",
    limit: 10,
    windowMs: 900000,
  },
  async (req, res, session) => {
    if (req.method === "GET")
      return res.status(200).json({
        content: await getRosaryContent(),
        editions: await RosaryEdition.find()
          .select("version note createdAt")
          .sort({ _id: -1 })
          .limit(15)
          .lean(),
      });
    const { content: input, note, reviewed, expectedVersion } = req.body || {};
    requireCondition(
      reviewed === true && validText(note, 500),
      400,
      "Confirme a revisão doutrinal e informe o motivo da edição.",
    );
    const previous = await getRosaryContent();
    requireCondition(
      previous.version === expectedVersion,
      409,
      "O conteúdo mudou. Recarregue e confira a versão atual antes de publicar.",
    );
    const content = prepareEdition(input);
    await ModerationLog.create({
      actorId: session.user.id,
      action: "publish-rosary",
      targetType: "rosary",
      targetId: content.version,
      reason: note,
    });
    await RosaryEdition.create({
      version: content.version,
      content,
      authorId: session.user.id,
      note,
    });
    return res.status(201).json({
      content,
      message:
        "Nova edição publicada. Orações em andamento preservam sua versão.",
    });
  },
);
