import {
  serverIntegrationEnabled,
  EMAIL_UNAVAILABLE,
} from "@/lib/integration-policy";
import { rejectCrossOriginMutation } from "@/lib/api-security";
import { validEmail } from "@/lib/validation";
import { buildPasswordResetEmailContent } from "@/lib/transactional-email";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";
import { createSecureToken, hashToken, normalizeEmail } from "@/lib/auth";
import { createBrevoTransport } from "@/lib/mailer";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const GENERIC_SUCCESS_MESSAGE =
  "Se existir uma conta com esse email, enviaremos um link para redefinir a senha.";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  if (!serverIntegrationEnabled("email"))
    return res.status(503).json({ error: EMAIL_UNAVAILABLE });
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const rateLimitResult = await checkRateLimit({
      ip: getClientIp(req),
      identity: normalizedEmail,
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

    if (!validEmail(normalizedEmail)) {
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
    const resetUrl = new URL("/reset-password", process.env.NEXTAUTH_URL);
    resetUrl.searchParams.set("token", rawToken);
    const { subject, html, text } = buildPasswordResetEmailContent({
      user,
      url: resetUrl.href,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject,
      html,
      text,
    });

    return res.status(200).json({ message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    console.error("Password recovery unavailable");
    return res
      .status(500)
      .json({ error: "Erro ao enviar recuperacao de senha" });
  }
}
