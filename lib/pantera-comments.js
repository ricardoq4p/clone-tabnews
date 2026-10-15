import Message from "./models/Message";
import Comment from "./models/Comment";
import {
  generatePanteraReply,
  hasPanteraMention,
  PANTERA_PROFILE,
} from "./pantera-ai";
import { notifyChange } from "./pusher";
export async function maybeReplyAsPantera({
  message,
  comment,
  authorName,
  communityId,
}) {
  const source = comment || message;
  if (!hasPanteraMention(source.content)) return;
  try {
    const parent = comment
      ? await Message.findById(comment.messageId)
          .populate("userId", "name")
          .lean()
      : message;
    if (!parent) return;
    const comments = comment
      ? await Comment.find({ messageId: comment.messageId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean()
      : [];
    const content = await generatePanteraReply({
      authorName,
      message: {
        ...parent,
        author: parent.userId?.name || parent.author || "Usuario",
      },
      comments,
      mentionSource: {
        type: comment ? "comment" : "post",
        content: source.content,
      },
    });
    await Comment.create({
      content,
      author: PANTERA_PROFILE.name,
      avatar: PANTERA_PROFILE.avatar,
      messageId: comment ? comment.messageId : message._id.toString(),
    });
    await notifyChange("comments", "new-comment", communityId);
  } catch {
    console.error("Pantera reply unavailable");
  }
}
