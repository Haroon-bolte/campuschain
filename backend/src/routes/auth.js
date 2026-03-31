const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ethers } = require("ethers");
const User = require("../models/User");

// ── JWT Helper ────────────────────────────────────────────────────────
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "supersecretkey123", {
    expiresIn: "30d",
  });
};

// ── 1. Register (Email/Password) ──────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default balance
    user = await User.create({ name, email, password: hashedPassword, role, balance: 5000 });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name, email, role, balance: user.balance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 2. Login (Email/Password) ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email, role: user.role, balance: user.balance || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 3. MetaMask SIWE: Get Nonce ────────────────────────────────────────
router.get("/nonce/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    let user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) {
      // Create a temporary user if it doesn't exist? Or require registration?
      // For this prototype, we'll allow on-the-fly registration via wallet
      user = await User.create({
        name: "Web3 User",
        email: `${wallet.toLowerCase()}@campuschain.io`,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        walletAddress: wallet.toLowerCase(),
        role: "Student",
      });
    }

    // Refresh nonce for security
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await user.save();

    res.json({ success: true, nonce: user.nonce });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 4. MetaMask SIWE: Verify Signature ─────────────────────────────────
router.post("/metamask", async (req, res) => {
  try {
    const { wallet, signature } = req.body;
    const user = await User.findOne({ walletAddress: wallet.toLowerCase() });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Verify signature
    const msg = `Welcome to CampusChain! Click to sign in and accept our terms. Nonce: ${user.nonce}`;
    const recoveredAddress = ethers.utils.verifyMessage(msg, signature);

    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(401).json({ success: false, message: "Signature verification failed" });
    }

    // Update nonce to prevent replay attacks
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, wallet, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 5. OTP Flow (Stubs) ────────────────────────────────────────────────
router.post("/otp-send", (req, res) => {
  const mockOtp = Math.floor(100000 + Math.random() * 900000);
  console.log(`📑 [STUB] Sending OTP ${mockOtp} to ${req.body.email}`);
  res.json({ success: true, message: "OTP sent (STUB)" });
});

router.post("/otp-verify", (req, res) => {
  res.json({ success: true, message: "OTP verified (STUB)" });
});

module.exports = router;
