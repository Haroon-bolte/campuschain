const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  val: { type: Number, required: true },
  unit: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  desc: String,
}, { timestamps: true });

module.exports = mongoose.model("Policy", policySchema);
