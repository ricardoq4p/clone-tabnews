import mongoose from "mongoose";
const schema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: { type: String, required: true, maxlength: 80 },
  targetType: { type: String, required: true, maxlength: 30 },
  targetId: { type: String, required: true },
  reason: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
schema.index({ createdAt: -1 });
export default mongoose.models.ModerationLog ||
  mongoose.model("ModerationLog", schema);
