const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: String, required: true },
  details: String,
  timestamp: { type: Date, default: Date.now },
  blockNumber: Number,
  txHash: { type: String, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
