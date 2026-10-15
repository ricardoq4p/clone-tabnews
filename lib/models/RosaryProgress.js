import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    version: { type: String, required: true },
    setId: { type: String, required: true },
    full: { type: Boolean, default: false },
    fatima: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    position: { type: Number, min: 0, required: true },
    revision: { type: Number, default: 1 },
  },
  { timestamps: true },
);
export default mongoose.models.RosaryProgress ||
  mongoose.model("RosaryProgress", schema);
