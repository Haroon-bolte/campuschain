const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

// @route   GET /api/transactions
// @desc    Get all transactions
router.get("/", async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction record
router.post("/", async (req, res) => {
  try {
    const tx = await Transaction.create(req.body);
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
