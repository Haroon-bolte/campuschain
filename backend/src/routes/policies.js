const express = require("express");
const router = express.Router();
const Policy = require("../models/Policy");

// @route   GET /api/policies
// @desc    Get all policies
router.get("/", async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/policies/:id
// @desc    Update policy (value or enabled status)
router.patch("/:id", async (req, res) => {
  try {
    const policy = await Policy.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!policy) return res.status(404).json({ success: false, message: "Policy not found" });
    res.json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
