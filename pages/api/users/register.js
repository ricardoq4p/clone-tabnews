import {
  isPreviewRegistrationEnabled,
  isPreviewTestEmail,
  previewVerificationUrl,
} from "@/lib/preview-registration";
import { rejectCrossOriginMutation } from "@/lib/api-security";
import { hash } from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { normalizeEmail } from "@/lib/auth";
import { checkRateLimit, createRateLimitErrorMessage } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { validEmail, validText } from "@/lib/validation";
import {
  createVerification,
  sendVerificationEmail,
} from "@/lib/verification-email";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Metodo nao permitido" });
  try {
    const { email, password, name } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const preview = isPreviewRegistrationEnabled();
    if (process.env.PANTERALAB_PREVIEW_REGISTRATION === "true" && !preview)
      return res.status(503).json({
        error: "O cadastro de teste ainda não está configurado neste ambiente.",
      });
    if (preview && !isPreviewTestEmail(normalizedEmail))
      return res.status(400).json({
        error:
          "Nesta homologação, utilize somente um email fictício terminado em @panteralab.test.",
      });
    const rate = await checkRateLimit({
      key: `register:${getClientIp(req)}:${normalizedEmail}`,
      ip: getClientIp(req),
      identity: normalizedEmail,
      limit: Number(process.env.RATE_LIMIT_REGISTER_MAX || 10),
      windowMs: Number(process.env.RATE_LIMIT_REGISTER_WINDOW_MS || 900000),
    });
    if (!rate.success)
      return res.status(429).json({
        error: createRateLimitErrorMessage(
          "Muitas tentativas de cadastro.",
          rate.retryAfter,
        ),
      });
    if (
      !validEmail(normalizedEmail) ||
      !validText(name, 100) ||
      typeof password !== "string" ||
      password.length < 6 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        error:
          "Informe nome, email valido e senha com pelo menos 6 caracteres e ate 72 bytes.",
      });
    }
    await connectToDatabase();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(409).json({
        error: "Email ja cadastrado. Se necessario, reenvie a confirmacao.",
      });
    const verification = createVerification();
    const user = await User.create({
      email: normalizedEmail,
      password: await hash(password, 12),
      name: name.trim(),
      username: normalizedEmail.split("@")[0],
      role: "user",
      isVerified: false,
      ...verification.fields,
    });
    if (preview)
      return res.status(201).json({
        message:
          "Conta fictícia criada. Confirme pelo link de teste abaixo; nenhum email foi enviado.",
        verificationUrl: previewVerificationUrl(
          normalizedEmail,
          verification.token,
        ),
      });
    try {
      await sendVerificationEmail(user, verification.token);
    } catch {
      console.error("Verification email delivery failed");
      return res.status(201).json({
        message:
          "Conta criada. Nao foi possivel enviar o email agora; solicite o reenvio da confirmacao.",
      });
    }
    return res.status(201).json({
      message: "Cadastro realizado! Verifique seu email para confirmar.",
    });
  } catch {
    return res
      .status(500)
      .json({ error: "Erro ao cadastrar. Tente novamente." });
  }
}
