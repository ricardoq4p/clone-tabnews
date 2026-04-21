import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    await connectToDatabase();

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        lastSeenAt: new Date(),
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("ERRO USER PRESENCE:", error);
    return res.status(500).json({ error: "Erro ao atualizar presenca" });
  }
}
