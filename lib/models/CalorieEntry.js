import mongoose from "mongoose";

const CalorieEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedCalories: {
      type: Number,
      required: true,
      min: 0,
    },
    matchedItems: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: "",
    },
    dayKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.CalorieEntry ||
  mongoose.model("CalorieEntry", CalorieEntrySchema);
