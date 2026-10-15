import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetType: { type: String, enum: ["candle", "message"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
schema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
schema.index({ targetType: 1, targetId: 1 });
export default mongoose.models.PrayerSupport ||
  mongoose.model("PrayerSupport", schema);
