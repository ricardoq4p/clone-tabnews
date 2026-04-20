import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema(
  {
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

export default mongoose.models.Community ||
  mongoose.model("Community", CommunitySchema);
