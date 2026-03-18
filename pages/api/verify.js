import connectToDatabase from "../../lib/db";
import User from "../../lib/models/User";

export default async function handler(req, res) {
  const { token } = req.query;

  try {
    await connectToDatabase();

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Token inválido" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return res.json({ message: "Conta verificada com sucesso!" });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao verificar" });
  }
}
