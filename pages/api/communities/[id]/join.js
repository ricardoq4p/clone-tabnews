import { rejectCrossOriginMutation } from "@/lib/api-security";
import User from "@/lib/models/User";
import { normalizeEmail } from "@/lib/auth";
import { isMember } from "@/lib/permissions";
import { isObjectId } from "@/lib/validation";
import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { createRateLimitErrorMessage, checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

function normalizeCommunity(community, sessionUserId) {
  const plainCommunity =
    typeof community?.toObject === "function"
      ? community.toObject()
      : community;
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
    avatar: plainCommunity.avatar || "",
    ownerId,
    ownerName: plainCommunity?.ownerId?.name || "Usuario",
    membersCount: memberIds.length,
    joined: Boolean(sessionUserId && memberIds.includes(sessionUserId)),
    isOwner: Boolean(sessionUserId && ownerId === sessionUserId),
    createdAt: plainCommunity.createdAt,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  await connectToDatabase();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const rateLimitResult = await checkRateLimit({
      ip: getClientIp(req),
      identity: session.user.id,
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
    if (!isObjectId(id))
      return res.status(400).json({ error: "Identificador invalido" });
    const { action } = req.body || {};
    if (!["join", "leave", "approve"].includes(action))
      return res.status(400).json({ error: "Acao invalida" });
    const community = await Community.findById(id);

    if (!community || community.deletedAt) {
      return res.status(404).json({ error: "Comunidade nao encontrada" });
    }

    if (
      action === "approve" &&
      community.ownerId.toString() !== session.user.id
    )
      return res
        .status(403)
        .json({ error: "Somente o responsavel pode adicionar participantes" });
    let userId = session.user.id;
    if (action === "approve") {
      const filter = req.body?.email
        ? { email: normalizeEmail(req.body.email) }
        : { _id: req.body?.userId };
      if (!req.body?.email && !isObjectId(req.body?.userId))
        return res.status(400).json({ error: "Usuario invalido" });
      const participant = await User.findOne({
        ...filter,
        isVerified: true,
        disabledAt: null,
      }).select("_id");
      if (!participant)
        return res
          .status(404)
          .json({ error: "Conta verificada nao encontrada" });
      userId = participant._id.toString();
    }
    if (!isObjectId(userId))
      return res.status(400).json({ error: "Usuario invalido" });
    if (
      action === "approve" &&
      community.ownerId.toString() !== session.user.id
    )
      return res
        .status(403)
        .json({ error: "Somente o responsavel pode adicionar participantes" });
    if (
      action === "join" &&
      community.privacy === "private" &&
      !isMember(community, userId)
    )
      return res
        .status(403)
        .json({ error: "Esta comunidade requer convite do responsavel" });
    const alreadyMember = community.members.some(
      (member) => member.toString() === userId,
    );

    if (action === "leave") {
      if (community.ownerId.toString() === userId) {
        return res
          .status(400)
          .json({ error: "O dono nao pode sair da propria comunidade" });
      }

      community.members = community.members.filter(
        (member) => member.toString() !== userId,
      );
    } else if (!alreadyMember) {
      community.members.push(userId);
    }

    await Community.updateOne(
      { _id: id, deletedAt: null },
      action === "leave"
        ? { $pull: { members: userId } }
        : { $addToSet: { members: userId } },
    );
    const updatedCommunity = await Community.findById(id);
    community.members = updatedCommunity.members;
    const populatedCommunity = await community.populate("ownerId", "name");

    return res
      .status(200)
      .json(normalizeCommunity(populatedCommunity, session.user.id));
  } catch (error) {
    console.error("ERRO JOIN COMMUNITY:", error);
    return res.status(500).json({ error: "Erro ao atualizar participacao" });
  }
}
