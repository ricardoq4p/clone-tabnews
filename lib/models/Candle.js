import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    authorName: { type: String, required: true, maxlength: 100 },
    intention: { type: String, required: true, trim: true, maxlength: 1200 },
    visibility: {
      type: String,
      enum: ["public", "anonymous", "private"],
      required: true,
    },
    policyVersion: { type: String, required: true, immutable: true },
    acceptedAt: { type: Date, required: true, immutable: true },
    status: {
      type: String,
      enum: ["active", "hidden", "withdrawn"],
      default: "active",
    },
    createdAt: { type: Date, required: true, immutable: true },
    expiresAt: { type: Date, required: true, immutable: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);
schema.index({ status: 1, visibility: 1, expiresAt: 1, _id: -1 });
schema.index({ ownerId: 1, _id: -1 });
// No TTL: expired candles remain in their owner's history.
export default mongoose.models.Candle || mongoose.model("Candle", schema);
