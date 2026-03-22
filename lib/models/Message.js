import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  content: String,
  createdAt: String,
  author: String,
});

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
