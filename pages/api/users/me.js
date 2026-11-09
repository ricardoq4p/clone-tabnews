import { rejectCrossOriginMutation } from "@/lib/api-security";
import connectToDatabase from "@/lib/db";
import Candle from "@/lib/models/Candle";
import Comment from "@/lib/models/Comment";
import User from "@/lib/models/User";
import { checkRateLimit, createRateLimitErrorMessage } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { validateDisplayName } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

function serializeProfile(user) {
  return {
    name: user.name,
    email: user.email,
    username: user.username,
    avatar: user.avatar || null,
    role: user.role || "user",
    calorieGoal: user.calorieGoal || 1200,
  };
}

function hasForeignTargetClaim(body = {}, sessionUser = {}) {
  const claimedIds = [body.userId, body.accountId, body.id, body._id].filter(
    (value) => value !== undefined && value !== null && value !== "",
  );
  if (
    claimedIds.some(
      (claimedId) => String(claimedId) !== String(sessionUser.id || ""),
    )
  ) {
    return true;
  }

  if (
    body.email !== undefined &&
    body.email !== null &&
    String(body.email).trim().toLowerCase() !==
      String(sessionUser.email || "")
        .trim()
        .toLowerCase()
  ) {
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (rejectCrossOriginMutation(req, res)) return;

  const method = req.method || "GET";
  if (!["GET", "PATCH", "PUT"].includes(method)) {
    res.setHeader("Allow", "GET, PATCH, PUT");
    return res.status(405).json({ error: "Método não permitido" });
  }

  await connectToDatabase();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email && !session?.user?.id) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    if (method === "GET") {
      const user = session.user.email
        ? await User.findOne({ email: session.user.email })
        : await User.findById(session.user.id);

      if (!user) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      return res.status(200).json(serializeProfile(user));
    }

    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    if (hasForeignTargetClaim(body, session.user)) {
      return res.status(403).json({
        error: "Você só pode editar o seu próprio perfil.",
      });
    }

    const identity = session.user.id || session.user.email;
    const ip = getClientIp(req);
    const rate = await checkRateLimit({
      key: `profile-name:${identity}:${ip}`,
      ip,
      identity,
      limit: Number(process.env.RATE_LIMIT_PROFILE_MAX || 10),
      windowMs: Number(process.env.RATE_LIMIT_PROFILE_WINDOW_MS || 900000),
    });

    if (!rate.success) {
      res.setHeader("Retry-After", String(rate.retryAfter));
      return res.status(429).json({
        error: createRateLimitErrorMessage(
          "Muitas alterações de perfil em pouco tempo.",
          rate.retryAfter,
        ),
      });
    }

    const validation = validateDisplayName(body.name);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const filter = session.user.id
      ? { _id: session.user.id }
      : { email: session.user.email };

    const updatedUser = await User.findOneAndUpdate(
      filter,
      { $set: { name: validation.value } },
      { returnDocument: "after" },
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }

    if (updatedUser._id) {
      await Promise.all([
        Candle.updateMany(
          { ownerId: updatedUser._id },
          { $set: { authorName: validation.value } },
        ),
        Comment.updateMany(
          { userId: updatedUser._id },
          { $set: { author: validation.value } },
        ),
      ]);
    }

    return res.status(200).json({
      message: "Nome de exibição atualizado com sucesso.",
      ...serializeProfile(updatedUser),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error:
        method === "GET"
          ? "Erro ao buscar usuario"
          : "Não foi possível atualizar o nome de exibição.",
    });
  }
}
