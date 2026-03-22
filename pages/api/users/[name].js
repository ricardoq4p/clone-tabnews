import connectToDatabase from "../../../lib/db";
import User from "../../../lib/models/User";

export default async function handler(req, res) {
  await connectToDatabase();

  const { name } = req.query;

  try {
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json({
      name: user.name,
      avatar: user.avatar || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
}
