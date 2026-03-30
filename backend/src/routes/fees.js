const express = require("express");
const router = express.Router();
const Fee = require("../models/Fee");

// @route   GET /api/fees
// @desc    Get all fees
router.get("/", async (req, res) => {
  try {
    const fees = await Fee.find().sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/fees/student/:sid
// @desc    Get fees for a student
router.get("/student/:sid", async (req, res) => {
  try {
    const fees = await Fee.find({ sid: req.params.sid }).sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/fees/:id
// @desc    Update fee status (Mark as Paid/Failed)
router.patch("/:id", async (req, res) => {
  try {
    const { status, txHash, paidAt } = req.body;
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      { $set: { status, txHash, paidAt } },
      { new: true }
    );
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });
    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/fees
// @desc    Create a new fee entry
router.post("/", async (req, res) => {
  try {
    const newFee = await Fee.create(req.body);
    res.status(201).json({ success: true, fee: newFee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
