import mongoose from "mongoose";
const schema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  note: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
schema.index({ _id: -1 });
export default mongoose.models.RosaryEdition ||
  mongoose.model("RosaryEdition", schema);
