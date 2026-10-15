import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kind: {
    type: String,
    enum: ["export", "exclusion", "correction"],
    required: true,
  },
  details: { type: String, maxlength: 500, default: "" },
  status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
schema.index({ userId: 1, _id: -1 });
schema.index({ status: 1, _id: -1 });
export default mongoose.models.PrivacyRequest ||
  mongoose.model("PrivacyRequest", schema);
