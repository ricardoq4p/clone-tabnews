import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema(
  {
    deletedAt: { type: Date, default: null },
    name: {
      type: String,
      required: [true, "Nome obrigatorio"],
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

CommunitySchema.index({ deletedAt: 1, privacy: 1 });
CommunitySchema.index({ members: 1, deletedAt: 1 });

export default mongoose.models.Community ||
  mongoose.model("Community", CommunitySchema);
