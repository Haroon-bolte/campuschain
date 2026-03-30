const express = require("express");
const router = express.Router();
const Dispute = require("../models/Dispute");

// @route   GET /api/disputes
// @desc    Get all disputes
router.get("/", async (req, res) => {
  try {
    const disputes = await Dispute.find().sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/disputes/:id
// @desc    Update dispute status (Resolve)
router.patch("/:id", async (req, res) => {
  try {
    const { status, resolvedAt } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { $set: { status, resolvedAt } },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });
    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
