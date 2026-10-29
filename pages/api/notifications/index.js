import { withApi, requireCondition } from "@/lib/api";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import Candle from "@/lib/models/Candle";
import Message from "@/lib/models/Message";
import Community from "@/lib/models/Community";
import {
  notificationCommentId,
  notificationHref,
  notificationMessage,
} from "@/lib/notifications";
import { isObjectId } from "@/lib/validation";
import { canReadCandle } from "@/lib/candles";
import { canReadCommunity, canReadMessage } from "@/lib/permissions";

const targetModels = { candle: Candle, message: Message, community: Community };

export default withApi(
  { methods: ["GET"], auth: true },
  async (req, res, session) => {
    const { before, limit: rawLimit } = req.query;
    requireCondition(!before || isObjectId(before), 400, "Página inválida.");
    const limit = Math.min(30, Math.max(1, Number(rawLimit) || 20));
    const items = await Notification.find({
      recipientId: session.user.id,
      ...(before ? { _id: { $lt: before } } : {}),
    })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("actorId", "name")
      .lean();

    const page = items.slice(0, limit);
    const visible = [];
    for (const item of page) {
      const Model = targetModels[item.targetType];
      if (!Model) continue;
      const target = await Model.findById(item.targetId).lean();
      let allowed = false;
      let communityId = null;
      if (item.targetType === "candle") {
        allowed = Boolean(
          target &&
            target.ownerId.toString() === session.user.id &&
            target.visibility === "public" &&
            canReadCandle(target, session.user.id),
        );
      } else if (item.targetType === "message") {
        const community = target?.communityId
          ? await Community.findById(target.communityId).lean()
          : null;
        allowed = canReadMessage(target, community, session.user.id);
        communityId = target?.communityId?.toString() || null;
      } else {
        allowed = canReadCommunity(target, session.user.id);
      }
      if (!allowed) continue;
      const commentId = notificationCommentId(item);
      visible.push({
        _id: item._id,
        type: item.type,
        actorName: item.actorId?.name || "Alguém",
        message: notificationMessage(item.type, item.actorId?.name),
        targetType: item.targetType,
        targetId: item.targetId,
        ...(commentId ? { commentId } : {}),
        communityId,
        href: notificationHref({ ...item, communityId, commentId }),
        readAt: item.readAt,
        createdAt: item.createdAt,
      });
    }
    return res.status(200).json({
      items: visible,
      next: items.length > limit ? items[limit - 1]._id : null,
    });
  },
);
