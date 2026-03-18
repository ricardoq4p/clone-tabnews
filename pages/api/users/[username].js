import connectToDatabase from "../../../lib/db";
import mongoose from "mongoose";

export default async function handler(req, res) {
  try {
    const { username } = req.query;

    // validação básica
    if (!username) {
      return res.status(400).json({ error: "Username é obrigatório" });
    }

    await connectToDatabase();

    // busca no MongoDB
    const user = await mongoose.connection.db
      .collection("users")
      .findOne({ username: username });

    // se não encontrar
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // resposta segura (sem senha, etc)
    return res.status(200).json({
      username: user.username,
      name: user.name || "",
      bio: user.bio || "",
      avatar_url: user.avatar_url || `https://github.com/${user.username}.png`,
      createdAt: user.createdAt || null,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}
