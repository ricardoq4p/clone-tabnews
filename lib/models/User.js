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
  avatar: {
    type: String,
    default: "",
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
