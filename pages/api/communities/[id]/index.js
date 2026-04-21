import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { isSuperadminSession } from "@/lib/auth";

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
    avatar: plainCommunity.avatar || "",
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
      const { id } = req.query;
      const community = await Community.findById(id).populate("ownerId", "name");

      if (!community) {
        return res.status(404).json({ error: "Comunidade nao encontrada" });
      }

      return res
        .status(200)
        .json(normalizeCommunity(community, session?.user?.id));
    } catch (error) {
      console.error("ERRO GET COMMUNITY:", error);
      return res.status(500).json({ error: "Erro ao buscar comunidade" });
    }
  }

  if (req.method === "PATCH") {
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

      const { name, description, privacy, avatar } = req.body;
      const trimmedName = name?.trim();
      const trimmedDescription = description?.trim() || "";

      if (!trimmedName) {
        return res.status(400).json({ error: "Digite um nome para a comunidade" });
      }

      const duplicatedCommunity = await Community.findOne({
        _id: { $ne: id },
        name: { $regex: `^${trimmedName}$`, $options: "i" },
      });

      if (duplicatedCommunity) {
        return res
          .status(409)
          .json({ error: "Ja existe uma comunidade com esse nome" });
      }

      community.name = trimmedName;
      community.description = trimmedDescription;
      community.privacy = privacy === "private" ? "private" : "public";
      community.avatar = typeof avatar === "string" ? avatar.trim() : "";

      await community.save();
      const populatedCommunity = await community.populate("ownerId", "name");

      return res
        .status(200)
        .json(normalizeCommunity(populatedCommunity, session.user.id));
    } catch (error) {
      console.error("ERRO PATCH COMMUNITY:", error);
      return res.status(500).json({ error: "Erro ao atualizar comunidade" });
    }
  }
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
