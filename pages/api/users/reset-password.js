import { hash } from "bcryptjs";
import { hashToken } from "@/lib/auth";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    const rateLimitResult = checkRateLimit({
      key: `reset-password:${getClientIp(req)}:${token || "anon"}`,
      limit: Number(process.env.RATE_LIMIT_RESET_PASSWORD_MAX || 5),
      windowMs: Number(
        process.env.RATE_LIMIT_RESET_PASSWORD_WINDOW_MS || 15 * 60 * 1000,
      ),
    });

    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: createRateLimitErrorMessage(
          "Muitas tentativas de redefinicao de senha.",
          rateLimitResult.retryAfter,
        ),
      });
    }

    if (!token || !password) {
      return res
        .status(400)
        .json({ error: "Token e nova senha sao obrigatorios." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A nova senha precisa ter pelo menos 6 caracteres." });
    }

    await connectToDatabase();

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Link invalido ou expirado." });
    }

    user.password = await hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Senha atualizada com sucesso." });
  } catch (error) {
    console.error("ERRO RESET PASSWORD:", error);
    return res.status(500).json({ error: "Erro ao redefinir senha" });
  }
}
