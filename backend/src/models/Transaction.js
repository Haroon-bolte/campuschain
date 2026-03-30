const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["FEE_PAYMENT", "TOKEN_MINT", "SMART_CTR", "P2P_XFER", "ADMIN_ACL", "TICKET_MINT"], required: true },
  status: { type: String, enum: ["PENDING", "CONFIRMED", "FAILED"], default: "PENDING" },
  service: String,
  note: String,
  blockNumber: Number,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
