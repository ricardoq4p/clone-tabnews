import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },
  },
  {
    timestamps: true, // 🔥 cria createdAt e updatedAt automaticamente
  },
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
