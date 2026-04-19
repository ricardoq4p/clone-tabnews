import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  await connectToDatabase();

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Nao autenticado" });
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const parsedGoal = Number(req.body?.goal);

    if (!Number.isFinite(parsedGoal) || parsedGoal < 300 || parsedGoal > 6000) {
      return res.status(400).json({ error: "Meta diaria invalida" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { calorieGoal: Math.round(parsedGoal) },
      { new: true },
    ).select("calorieGoal");

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }

    return res.status(200).json({ goal: updatedUser.calorieGoal });
  } catch (error) {
    console.error("Erro ao atualizar meta diaria:", error);
    return res.status(500).json({ error: "Erro ao atualizar meta diaria" });
  }
}
