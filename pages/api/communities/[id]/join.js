import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const rateLimitResult = checkRateLimit({
      key: `communities:join:${session.user.id}:${getClientIp(req)}`,
      limit: Number(process.env.RATE_LIMIT_COMMUNITIES_JOIN_MAX || 20),
      windowMs: Number(
        process.env.RATE_LIMIT_COMMUNITIES_JOIN_WINDOW_MS || 5 * 60 * 1000,
      ),
    });

    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: createRateLimitErrorMessage(
          "Muitas tentativas de atualizar participacao.",
          rateLimitResult.retryAfter,
        ),
      });
    }

    const { id } = req.query;
    const { action } = req.body;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({ error: "Comunidade nao encontrada" });
    }

    const userId = session.user.id;
    const isMember = community.members.some((member) => member.toString() === userId);

    if (action === "leave") {
      if (community.ownerId.toString() === userId) {
        return res
          .status(400)
          .json({ error: "O dono nao pode sair da propria comunidade" });
      }

      community.members = community.members.filter(
        (member) => member.toString() !== userId,
      );
    } else if (!isMember) {
      community.members.push(userId);
    }

    await community.save();
    const populatedCommunity = await community.populate("ownerId", "name");

    return res
      .status(200)
      .json(normalizeCommunity(populatedCommunity, session.user.id));
  } catch (error) {
    console.error("ERRO JOIN COMMUNITY:", error);
    return res.status(500).json({ error: "Erro ao atualizar participacao" });
  }
}
