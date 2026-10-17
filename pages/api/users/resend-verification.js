import {
  serverIntegrationEnabled,
  EMAIL_UNAVAILABLE,
} from "@/lib/integration-policy";
import { rejectCrossOriginMutation } from "@/lib/api-security";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { normalizeEmail } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { validEmail } from "@/lib/validation";
import {
  createVerification,
  sendVerificationEmail,
} from "@/lib/verification-email";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Metodo nao permitido" });
  const message =
    "Se houver uma conta pendente, enviaremos um novo link de confirmacao.";
  if (!serverIntegrationEnabled("email"))
    return res.status(503).json({ error: EMAIL_UNAVAILABLE });
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validEmail(email))
      return res.status(400).json({ error: "Informe um email valido." });
    const rate = await checkRateLimit({
      key: `verification:${getClientIp(req)}:${email}`,
      ip: getClientIp(req),
      identity: email,
      limit: 3,
      windowMs: 900000,
    });
    if (!rate.success)
      return res
        .status(429)
        .json({ error: "Aguarde antes de solicitar outro email." });
    await connectToDatabase();
    const verification = createVerification();
    const user = await User.findOneAndUpdate(
      { email, isVerified: false },
      { $set: verification.fields },
      { returnDocument: "after" },
    );
    if (user) {
      try {
        await sendVerificationEmail(user, verification.token, {
          isResend: true,
        });
      } catch {
        console.error("Verification email delivery failed");
      }
    }
    return res.status(200).json({ message });
  } catch {
    return res
      .status(500)
      .json({ error: "Nao foi possivel solicitar a confirmacao." });
  }
}
