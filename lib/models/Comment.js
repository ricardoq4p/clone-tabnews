import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    idempotencyKey: { type: String, maxlength: 80, immutable: true },
  },
  {
    timestamps: true,
  },
);

CommentSchema.index({ messageId: 1, _id: -1 });
CommentSchema.index(
  { userId: 1, messageId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
