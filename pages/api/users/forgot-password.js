import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";
import { createSecureToken, hashToken, normalizeEmail } from "@/lib/auth";
import { createBrevoTransport } from "@/lib/mailer";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const GENERIC_SUCCESS_MESSAGE =
  "Se existir uma conta com esse email, enviaremos um link para redefinir a senha.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const rateLimitResult = checkRateLimit({
      key: `forgot-password:${getClientIp(req)}:${normalizedEmail || "anon"}`,
      limit: Number(process.env.RATE_LIMIT_FORGOT_PASSWORD_MAX || 5),
      windowMs: Number(
        process.env.RATE_LIMIT_FORGOT_PASSWORD_WINDOW_MS || 15 * 60 * 1000,
      ),
    });

    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: createRateLimitErrorMessage(
          "Muitas tentativas de recuperacao de senha.",
          rateLimitResult.retryAfter,
        ),
      });
    }

    if (!normalizedEmail) {
      return res
        .status(400)
        .json({ error: "Digite um email valido para continuar." });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ message: GENERIC_SUCCESS_MESSAGE });
    }

    const rawToken = createSecureToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    const transporter = createBrevoTransport();
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject: "Redefina sua senha no PanteraLab",
      html: `
        <h2>Oi ${user.name || "por ai"}!</h2>
        <p>Recebemos um pedido para redefinir sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}">Redefinir minha senha</a>
        <p>Esse link expira em 30 minutos.</p>
        <p>Se voce nao pediu essa alteracao, pode ignorar este email.</p>
      `,
    });

    return res.status(200).json({ message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    console.error("ERRO FORGOT PASSWORD:", error);
    return res.status(500).json({ error: "Erro ao enviar recuperacao de senha" });
  }
}
