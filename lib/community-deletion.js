import mongoose from "mongoose";
import connectToDatabase from "./db";
import { ApiError } from "./api";
import { canDeleteContent } from "./permissions";
export async function deleteCommunityContent(
  type,
  id,
  session,
  { adminOnly = false, reason = "Exclusão confirmada na comunidade" } = {},
) {
  if (
    !["message", "comment"].includes(type) ||
    !mongoose.isObjectIdOrHexString(id)
  )
    throw new ApiError(400, "Conteúdo inválido.");
  if (!session?.user?.id || !mongoose.isObjectIdOrHexString(session.user.id))
    throw new ApiError(401, "Entre novamente na sua conta.");
  if (
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.trim().length > 500
  )
    throw new ApiError(400, "Informe um motivo de até 500 caracteres.");
  const connection = await connectToDatabase(),
    db = connection.connection.db;
  const transaction = await connection.startSession();
  let result;
  try {
    await transaction.withTransaction(async () => {
      const options = { session: transaction },
        objectId = new mongoose.Types.ObjectId(id);
      const user = await db
        .collection("users")
        .findOne(
          { _id: new mongoose.Types.ObjectId(session.user.id) },
          { ...options, projection: { role: 1, isVerified: 1, disabledAt: 1 } },
        );
      if (!user?.isVerified || user.disabledAt)
        throw new ApiError(401, "Entre novamente na sua conta.");
      const effective = {
        user: { id: session.user.id, role: user.role || "user" },
      };
      if (adminOnly && effective.user.role !== "superadmin")
        throw new ApiError(403, "Acesso reservado à administração.");
      const collection = type === "message" ? "messages" : "comments";
      const content = await db
        .collection(collection)
        .findOne({ _id: objectId }, options);
      if (!content) throw new ApiError(404, "Conteúdo não encontrado.");
      if (!canDeleteContent(content, effective))
        throw new ApiError(403, "Sem permissão.");
      const comments =
        type === "message"
          ? await db
              .collection("comments")
              .find(
                { messageId: { $in: [id, objectId] } },
                { ...options, projection: { _id: 1 } },
              )
              .toArray()
          : [{ _id: objectId }];
      const commentIds = comments.map((item) => item._id);
      if (type === "message") {
        await db
          .collection("prayersupports")
          .deleteMany({ targetType: "message", targetId: objectId }, options);
        await db
          .collection("abusereports")
          .deleteMany({ targetType: "message", targetId: objectId }, options);
      }
      if (commentIds.length) {
        await db
          .collection("abusereports")
          .deleteMany(
            { targetType: "comment", targetId: { $in: commentIds } },
            options,
          );
        await db
          .collection("comments")
          .deleteMany({ _id: { $in: commentIds } }, options);
      }
      if (type === "message")
        await db.collection("messages").deleteOne({ _id: objectId }, options);
      if (effective.user.role === "superadmin")
        await db.collection("moderationlogs").insertOne(
          {
            actorId: user._id,
            action: "delete-content",
            targetType: type,
            targetId: id,
            reason: reason.trim(),
            createdAt: new Date(),
          },
          options,
        );
      result = {
        success: true,
        deletedComments: type === "message" ? commentIds.length : 1,
      };
    });
    return result;
  } finally {
    await transaction.endSession();
  }
}
