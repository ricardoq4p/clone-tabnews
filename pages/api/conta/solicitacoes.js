import { withApi, requireCondition } from "@/lib/api";
import PrivacyRequest from "@/lib/models/PrivacyRequest";
export default withApi(
  {
    methods: ["GET", "POST"],
    auth: true,
    scope: "privacy-request",
    limit: 3,
    windowMs: 86400000,
  },
  async (req, res, session) => {
    if (req.method === "GET")
      return res.status(200).json({
        items: await PrivacyRequest.find({ userId: session.user.id })
          .select("kind status createdAt")
          .sort({ _id: -1 })
          .limit(20)
          .lean(),
      });
    const { kind, details = "" } = req.body || {};
    requireCondition(
      ["export", "exclusion", "correction"].includes(kind) &&
        typeof details === "string" &&
        details.length <= 500,
      400,
      "Solicitação inválida.",
    );
    await PrivacyRequest.create({
      userId: session.user.id,
      kind,
      details: details.trim(),
    });
    return res.status(201).json({
      message:
        "Solicitação registrada para análise da administração. Nenhum dado foi excluído automaticamente.",
    });
  },
);
