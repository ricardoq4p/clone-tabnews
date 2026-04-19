import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
