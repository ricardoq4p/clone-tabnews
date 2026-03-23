import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  content: String,
  author: String,
  username: String, // 👈 ESSENCIAL
  createdAt: Date, // 👈 melhor usar Date
});

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
