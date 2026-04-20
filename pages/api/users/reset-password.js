import crypto from "crypto";
import { hash } from "bcryptjs";
import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

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

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

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
