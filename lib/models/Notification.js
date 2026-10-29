import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    type: {
      type: String,
      enum: [
        "candle_prayer",
        "message_prayer",
        "message_comment",
        "community_invite",
      ],
      required: true,
      immutable: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetType: {
      type: String,
      enum: ["candle", "message", "community"],
      required: true,
      immutable: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      immutable: true,
    },
    dedupeKey: { type: String, required: true, immutable: true },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false },
);

schema.index({ recipientId: 1, _id: -1 });
schema.index({ recipientId: 1, readAt: 1 });
schema.index({ recipientId: 1, dedupeKey: 1 }, { unique: true });

export default mongoose.models.Notification ||
  mongoose.model("Notification", schema);
