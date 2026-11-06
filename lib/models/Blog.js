import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 60,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 320,
    },
    authorBio: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 600,
    },
    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "blogs",
  },
);

BlogSchema.index({ ownerId: 1 }, { unique: true });
BlogSchema.index({ normalizedName: 1 }, { unique: true });
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1, updatedAt: -1, _id: -1 });

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
