import mongoose from "mongoose";
const schema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetType: {
    type: String,
    enum: ["candle", "message", "comment"],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: ["privacy", "disrespect", "spam", "other"],
    required: true,
  },
  details: { type: String, maxlength: 500, default: "" },
  status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
schema.index({ reporterId: 1, targetType: 1, targetId: 1 }, { unique: true });
schema.index({ status: 1, _id: -1 });
export default mongoose.models.AbuseReport ||
  mongoose.model("AbuseReport", schema);
