import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  content: String,
  author: String,
  messageId: String,
  createdAt: Date,
});

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
