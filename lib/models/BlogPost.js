import mongoose from "mongoose";
import { BLOG_CATEGORIES } from "../blogs";

export const BLOG_POST_CATEGORIES = BLOG_CATEGORIES;

const BlogPostSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 220,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 120,
    },
    category: {
      type: String,
      enum: BLOG_POST_CATEGORIES,
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 30000,
    },
    status: {
      type: String,
      enum: ["draft", "published", "hidden"],
      default: "draft",
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
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "blog_posts",
  },
);

BlogPostSchema.index({ blogId: 1, slug: 1 }, { unique: true });
BlogPostSchema.index({ blogId: 1, status: 1, publishedAt: -1, _id: -1 });
BlogPostSchema.index({ authorId: 1, updatedAt: -1, _id: -1 });

export default mongoose.models.BlogPost ||
  mongoose.model("BlogPost", BlogPostSchema);
