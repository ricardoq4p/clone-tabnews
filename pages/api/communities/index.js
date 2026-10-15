import { rejectCrossOriginMutation } from "@/lib/api-security";
import { validText, validImageUrl, escapeRegex } from "@/lib/validation";
import connectToDatabase from "@/lib/db";
import Community from "@/lib/models/Community";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
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
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const session = await getServerSession(req, res, authOptions);
      const communities = await Community.find({
        deletedAt: null,
        $or: [
          { privacy: "public" },
          ...(session?.user?.id
            ? [{ ownerId: session.user.id }, { members: session.user.id }]
            : []),
        ],
      })
        .populate("ownerId", "name")
        .sort({ createdAt: -1 });

      return res
        .status(200)
        .json(
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

      const rateLimitResult = await checkRateLimit({
        ip: getClientIp(req),
        identity: session.user.id,
        key: `communities:create:${session.user.id}:${getClientIp(req)}`,
        limit: Number(process.env.RATE_LIMIT_COMMUNITIES_CREATE_MAX || 3),
        windowMs: Number(
          process.env.RATE_LIMIT_COMMUNITIES_CREATE_WINDOW_MS || 15 * 60 * 1000,
        ),
      });

      if (!rateLimitResult.success) {
        return res.status(429).json({
          error: createRateLimitErrorMessage(
            "Muitas tentativas de criar comunidade.",
            rateLimitResult.retryAfter,
          ),
        });
      }

      const { name, description, privacy, avatar } = req.body;
      const trimmedName = typeof name === "string" ? name.trim() : "";
      const trimmedDescription =
        typeof description === "string" ? description.trim() : "";

      if (
        !validText(trimmedName, 60) ||
        trimmedDescription.length > 220 ||
        (avatar && !validImageUrl(avatar))
      ) {
        return res
          .status(400)
          .json({ error: "Digite um nome para a comunidade" });
      }

      const existingCommunity = await Community.findOne({
        deletedAt: null,
        name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
      });

      if (existingCommunity) {
        return res
          .status(409)
          .json({ error: "Ja existe uma comunidade com esse nome" });
      }

      const community = await Community.create({
        name: trimmedName,
        description: trimmedDescription,
        avatar: typeof avatar === "string" ? avatar.trim() : "",
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
