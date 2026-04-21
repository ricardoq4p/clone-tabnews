import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { isSuperadminSession } from "@/lib/auth";
import connectToDatabase from "../../lib/db";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !isSuperadminSession(session)) {
    const statusCode = process.env.NODE_ENV === "production" ? 404 : 403;
    return res.status(statusCode).json({ error: "Rota indisponivel" });
  }

  await connectToDatabase();

  const users = await mongoose.connection.db
    .collection("users")
    .find({})
    .toArray();

  for (const user of users) {
    const username = user.email.split("@")[0];

    await mongoose.connection.db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { username },
      },
    );
  }

  return res.status(200).json({ message: "Users atualizados com sucesso." });
}
