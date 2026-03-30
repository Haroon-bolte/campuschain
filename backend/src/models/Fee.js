const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  sid: { type: Number, required: true },
  sname: { type: String, required: true },
  cat: { type: String, required: true },
  amount: { type: Number, required: true },
  due: { type: Date, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Failed"], default: "Pending" },
  txHash: String,
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Fee", feeSchema);
