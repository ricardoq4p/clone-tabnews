import mongoose from "mongoose";
const schema = new mongoose.Schema({
  _id: String,
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});
export default mongoose.models.RateLimitBucket ||
  mongoose.model("RateLimitBucket", schema);
