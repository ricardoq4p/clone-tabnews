import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { isSuperadminSession } from "@/lib/auth";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const { id } = req.query;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({ error: "Comunidade nao encontrada" });
    }

    const isOwner = community.ownerId.toString() === session.user.id;

    if (!isOwner && !isSuperadminSession(session)) {
      return res.status(403).json({ error: "Sem permissao" });
    }

    await Community.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("ERRO DELETE COMMUNITY:", error);
    return res.status(500).json({ error: "Erro ao deletar comunidade" });
  }
}
