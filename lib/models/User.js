import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email obrigatorio"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Senha obrigatoria"],
    minlength: 6,
  },
  name: {
    type: String,
    required: [true, "Nome obrigatorio"],
  },
  username: {
    type: String,
    default: "",
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  calorieGoal: {
    type: Number,
    default: 1200,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
