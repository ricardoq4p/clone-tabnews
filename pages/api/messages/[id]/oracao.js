import { withApi, requireCondition } from "@/lib/api";
import { readableMessage } from "@/lib/message-access";
import { recordPrayer } from "@/lib/prayer-support";
import { isObjectId } from "@/lib/validation";
export default withApi(
  { methods: ["PUT"], auth: true, scope: "message-prayer", limit: 30 },
  async (req, res, session) => {
    requireCondition(isObjectId(req.query.id), 400, "Identificador inválido.");
    const parent = await readableMessage(req.query.id, session);
    requireCondition(parent, 404, "Publicação indisponível.");
    return res
      .status(200)
      .json(await recordPrayer("message", parent.message._id, session.user.id));
  },
);
