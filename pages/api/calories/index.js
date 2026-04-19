import connectToDatabase from "@/lib/db";
import CalorieEntry from "@/lib/models/CalorieEntry";
import User from "@/lib/models/User";
import { estimateCaloriesFromText } from "@/lib/calorie-estimator";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

function getBrazilDayKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

async function getCurrentUser(session) {
  return User.findOne({ email: session.user.email }).select("_id calorieGoal");
}

export default async function handler(req, res) {
  await connectToDatabase();

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Nao autenticado" });
  }

  const currentUser = await getCurrentUser(session);

  if (!currentUser) {
    return res.status(404).json({ error: "Usuario nao encontrado" });
  }

  const todayKey = getBrazilDayKey();

  if (req.method === "GET") {
    try {
      const entries = await CalorieEntry.find({
        userId: currentUser._id,
        dayKey: todayKey,
      }).sort({ createdAt: -1 });

      const totalCalories = entries.reduce(
        (sum, entry) => sum + entry.estimatedCalories,
        0,
      );
      const goal = currentUser.calorieGoal || 1200;

      return res.status(200).json({
        dayKey: todayKey,
        goal,
        totalCalories,
        remainingCalories: goal - totalCalories,
        entries,
      });
    } catch (error) {
      console.error("Erro ao buscar contador de calorias:", error);
      return res.status(500).json({ error: "Erro ao buscar calorias" });
    }
  }

  if (req.method === "POST") {
    try {
      const { description } = req.body;

      if (!description?.trim()) {
        return res.status(400).json({ error: "Descreva o alimento consumido" });
      }

      const estimation = estimateCaloriesFromText(description);
      const entry = await CalorieEntry.create({
        userId: currentUser._id,
        description: estimation.description,
        estimatedCalories: estimation.estimatedCalories,
        matchedItems: estimation.matchedItems,
        note: estimation.note,
        dayKey: todayKey,
      });

      const entries = await CalorieEntry.find({
        userId: currentUser._id,
        dayKey: todayKey,
      }).sort({ createdAt: -1 });

      const totalCalories = entries.reduce(
        (sum, currentEntry) => sum + currentEntry.estimatedCalories,
        0,
      );
      const goal = currentUser.calorieGoal || 1200;

      return res.status(201).json({
        createdEntry: entry,
        dayKey: todayKey,
        goal,
        totalCalories,
        remainingCalories: goal - totalCalories,
        entries,
      });
    } catch (error) {
      console.error("Erro ao registrar alimento:", error);
      return res.status(500).json({ error: "Erro ao registrar alimento" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Registro nao informado" });
      }

      const entry = await CalorieEntry.findOne({
        _id: id,
        userId: currentUser._id,
      });

      if (!entry) {
        return res.status(404).json({ error: "Registro nao encontrado" });
      }

      await CalorieEntry.findByIdAndDelete(id);

      const entries = await CalorieEntry.find({
        userId: currentUser._id,
        dayKey: todayKey,
      }).sort({ createdAt: -1 });

      const totalCalories = entries.reduce(
        (sum, currentEntry) => sum + currentEntry.estimatedCalories,
        0,
      );
      const goal = currentUser.calorieGoal || 1200;

      return res.status(200).json({
        dayKey: todayKey,
        goal,
        totalCalories,
        remainingCalories: goal - totalCalories,
        entries,
      });
    } catch (error) {
      console.error("Erro ao remover registro de calorias:", error);
      return res.status(500).json({ error: "Erro ao remover registro" });
    }
  }

  return res.status(405).json({ error: "Metodo nao permitido" });
}
