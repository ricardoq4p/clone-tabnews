import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

function normalizeCommunity(community, sessionUserId) {
  const plainCommunity =
    typeof community?.toObject === "function" ? community.toObject() : community;
  const ownerId =
    typeof plainCommunity?.ownerId === "string"
      ? plainCommunity.ownerId
      : plainCommunity?.ownerId?._id?.toString();
  const memberIds = (plainCommunity?.members || []).map((member) =>
    typeof member === "string" ? member : member?.toString(),
  );

  return {
    _id: plainCommunity._id.toString(),
    name: plainCommunity.name,
    description: plainCommunity.description || "",
    privacy: plainCommunity.privacy,
    ownerId,
    ownerName: plainCommunity?.ownerId?.name || "Usuario",
    membersCount: memberIds.length,
    joined: Boolean(sessionUserId && memberIds.includes(sessionUserId)),
    isOwner: Boolean(sessionUserId && ownerId === sessionUserId),
    createdAt: plainCommunity.createdAt,
  };
}

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const session = await getServerSession(req, res, authOptions);
      const communities = await Community.find()
        .populate("ownerId", "name")
        .sort({ createdAt: -1 });

      return res.status(200).json(
        communities.map((community) =>
          normalizeCommunity(community, session?.user?.id),
        ),
      );
    } catch (error) {
      console.error("ERRO GET COMMUNITIES:", error);
      return res.status(500).json({ error: "Erro ao buscar comunidades" });
    }
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: "Nao autenticado" });
      }

      const { name, description, privacy } = req.body;
      const trimmedName = name?.trim();
      const trimmedDescription = description?.trim() || "";

      if (!trimmedName) {
        return res.status(400).json({ error: "Digite um nome para a comunidade" });
      }

      const existingCommunity = await Community.findOne({
        name: { $regex: `^${trimmedName}$`, $options: "i" },
      });

      if (existingCommunity) {
        return res
          .status(409)
          .json({ error: "Ja existe uma comunidade com esse nome" });
      }

      const community = await Community.create({
        name: trimmedName,
        description: trimmedDescription,
        privacy: privacy === "private" ? "private" : "public",
        ownerId: session.user.id,
        members: [session.user.id],
      });

      const populatedCommunity = await community.populate("ownerId", "name");

      return res
        .status(201)
        .json(normalizeCommunity(populatedCommunity, session.user.id));
    } catch (error) {
      console.error("ERRO CREATE COMMUNITY:", error);
      return res.status(500).json({ error: "Erro ao criar comunidade" });
    }
  }

  return res.status(405).json({ error: "Metodo nao permitido" });
}
