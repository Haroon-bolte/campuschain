const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  venue: { type: String, required: true },
  price: { type: Number, required: true },
  cap: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Cancelled", "Completed"], default: "Active" },
  desc: String,
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
