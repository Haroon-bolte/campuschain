const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Student", "Faculty"], default: "Student" },
  walletAddress: { type: String, unique: true },
  kycVerified: { type: Boolean, default: false },
  status: { type: String, enum: ["Active", "Suspended"], default: "Active" },
  dept: String,
  rollNo: String,
  semester: Number,
  otp: String,
  otpExpires: Date,
  nonce: { type: String, default: () => Math.floor(Math.random() * 1000000).toString() },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
