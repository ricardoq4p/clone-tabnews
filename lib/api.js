import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import connectToDatabase from "./db";
import { rejectCrossOriginMutation } from "./api-security";
import { checkRateLimit } from "./rate-limit";
import { getClientIp } from "./request";
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireCondition(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}
export function withApi(options, action) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!options.methods.includes(req.method)) {
      res.setHeader("Allow", options.methods.join(", "));
      return res.status(405).json({ error: "Método não permitido." });
    }
    if (rejectCrossOriginMutation(req, res)) return;
    try {
      if (!process.env.MONGODB_URI)
        throw new ApiError(
          503,
          "Este ambiente ainda não está conectado à comunidade. Você pode rezar o Rosário sem cadastro.",
        );
      await connectToDatabase();
      const session = await getServerSession(req, res, authOptions);
      if (options.auth || options.admin || req.method !== "GET")
        requireCondition(
          session?.user?.id,
          401,
          "Entre na sua conta para continuar.",
        );
      if (req.body?.accountId !== undefined)
        requireCondition(
          req.body.accountId === session?.user?.id,
          401,
          "Sua conta mudou. Atualize a página antes de continuar.",
        );
      if (options.admin)
        requireCondition(
          session?.user?.role === "superadmin",
          403,
          "Acesso reservado à administração.",
        );
      if (req.method !== "GET" && options.limit) {
        const rate = await checkRateLimit({
          key: `${options.scope}:${session?.user?.id || "visitor"}:${getClientIp(req)}`,
          ip: getClientIp(req),
          identity: session?.user?.id,
          limit: options.limit,
          windowMs: options.windowMs || 60000,
        });
        if (!rate.success) {
          res.setHeader("Retry-After", String(rate.retryAfter));
          throw new ApiError(
            429,
            "Vamos com calma. Aguarde um pouco antes de tentar novamente.",
          );
        }
      }
      return await action(req, res, session);
    } catch (error) {
      return res.status(error instanceof ApiError ? error.status : 503).json({
        error:
          error instanceof ApiError
            ? error.message
            : "Não foi possível concluir agora. Tente novamente em instantes.",
      });
    }
  };
}
