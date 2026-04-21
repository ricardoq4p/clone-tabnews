import { hashToken } from "@/lib/auth";
import connectToDatabase from "../../lib/db";
import User from "../../lib/models/User";

export default async function handler(req, res) {
  const token = String(req.query?.token || "").trim();

  try {
    if (!token) {
      return res.status(400).json({ message: "Token invalido" });
    }

    await connectToDatabase();

    const now = new Date();
    const tokenHash = hashToken(token);
    const allowLegacyFallback =
      process.env.ALLOW_LEGACY_EMAIL_VERIFICATION_FALLBACK !== "false";

    const verificationQueries = [
      {
        verificationToken: tokenHash,
        verificationTokenExpires: { $gt: now },
      },
    ];

    if (allowLegacyFallback) {
      verificationQueries.push({
        verificationToken: token,
        $or: [
          { verificationTokenExpires: { $exists: false } },
          { verificationTokenExpires: null },
        ],
      });
    }

    const user = await User.findOne({
      $or: verificationQueries,
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalido ou expirado" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.json({ message: "Conta verificada com sucesso!" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao verificar" });
  }
}
