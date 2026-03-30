const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
  sname: { type: String, required: true },
  reason: { type: String, required: true },
  amount: { type: Number, required: true },
  pri: { type: String, enum: ["HIGH", "MED", "LOW"], default: "MED" },
  raised: { type: Date, default: Date.now },
  status: { type: String, enum: ["Open", "Resolved"], default: "Open" },
  resolvedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Dispute", disputeSchema);
