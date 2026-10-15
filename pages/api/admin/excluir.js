import { withApi, requireCondition } from "@/lib/api";
import { deleteCommunityContent } from "@/lib/community-deletion";
import { isObjectId, validText } from "@/lib/validation";
export default withApi(
  {
    methods: ["DELETE"],
    admin: true,
    limit: 10,
    scope: "admin-delete-content",
  },
  async (req, res, session) => {
    const { type, id, reason } = req.body || {};
    requireCondition(
      ["message", "comment"].includes(type) &&
        isObjectId(id) &&
        validText(reason, 500),
      400,
      "Informe o conteúdo e o motivo da exclusão.",
    );
    const result = await deleteCommunityContent(type, id, session, {
      adminOnly: true,
      reason,
    });
    return res
      .status(200)
      .json({ ...result, message: "Conteúdo excluído definitivamente." });
  },
);
