import mongoose from "mongoose";
import Notification from "./models/Notification";
import {
  notificationCommentId,
  notificationHref,
  parseNotificationTarget,
  resolveNotificationTarget,
} from "./validation";

export {
  notificationCommentId,
  notificationHref,
  parseNotificationTarget,
  resolveNotificationTarget,
};

const allowedTargets = {
  candle_prayer: "candle",
  message_prayer: "message",
  message_comment: "message",
  community_invite: "community",
};

export async function createNotification({
  recipientId,
  actorId,
  type,
  targetId,
  commentId,
  dedupeKey,
}) {
  if (
    !recipientId ||
    !mongoose.isValidObjectId(recipientId) ||
    (actorId && recipientId.toString() === actorId.toString()) ||
    (actorId && !mongoose.isValidObjectId(actorId)) ||
    allowedTargets[type] == null ||
    !mongoose.isValidObjectId(targetId) ||
    (commentId != null && !mongoose.isValidObjectId(commentId)) ||
    typeof dedupeKey !== "string" ||
    !dedupeKey ||
    dedupeKey.length > 180
  )
    return false;

  const resolvedCommentId =
    type === "message_comment"
      ? commentId?.toString?.() ||
        commentId ||
        notificationCommentId({ type, dedupeKey })
      : null;

  try {
    await Notification.init();
    await Notification.updateOne(
      { recipientId, dedupeKey },
      {
        $setOnInsert: {
          recipientId,
          actorId: actorId || null,
          type,
          targetType: allowedTargets[type],
          targetId,
          ...(resolvedCommentId ? { commentId: resolvedCommentId } : {}),
          dedupeKey,
        },
      },
      { upsert: true },
    );
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

// Notifications are secondary to the primary interaction and must not fail it.
export async function tryCreateNotification(input) {
  try {
    return await createNotification(input);
  } catch {
    console.error("Notification creation unavailable", { type: input.type });
    return false;
  }
}

export function notificationMessage(type, actorName) {
  const actor = actorName || "Alguém";
  switch (type) {
    case "candle_prayer":
      return `${actor} rezou pela sua intenção pública.`;
    case "message_prayer":
      return `${actor} rezou pela sua publicação.`;
    case "message_comment":
      return `${actor} comentou sua publicação.`;
    case "community_invite":
      return `${actor} convidou você para uma comunidade privada.`;
    default:
      return "Você tem uma nova notificação.";
  }
}
