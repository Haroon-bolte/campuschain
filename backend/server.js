/**
 * CampusChain Backend — Prototype
 * ─────────────────────────────────
 * Node.js + Express + MongoDB + Ethers.js
 */

require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const mongoose   = require("mongoose");
const rateLimit  = require("express-rate-limit");
const http       = require("http");
const { Server } = require("socket.io");

const web3   = require("./src/services/web3Service");
const ipfs   = require("./src/services/ipfsService");

// ── Routes ────────────────────────────────────────────────────────────
// Note: Adjusted paths to match our src structure
const authRoutes         = require("./src/routes/auth");
const userRoutes         = require("./src/routes/users");
const feeRoutes          = require("./src/routes/fees");
const transactionRoutes  = require("./src/routes/transactions");
const eventRoutes        = require("./src/routes/events");
const disputeRoutes      = require("./src/routes/disputes");
const policyRoutes       = require("./src/routes/policies");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true },
});

// ── Global Middleware ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rate limiter — 100 req / 15 min per IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      100,
    message:  { success: false, message: "Too many requests, slow down!" },
  })
);

// ── Routes ────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/fees",         feeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/events",       eventRoutes);
app.use("/api/disputes",     disputeRoutes);
app.use("/api/policies",     policyRoutes);

// ── Health check ──────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  const blockNumber = await web3.getLatestBlock();
  res.json({
    status:      "ok",
    service:     "CampusChain Backend",
    version:     "1.0.0",
    timestamp:   new Date().toISOString(),
    mongodb:     mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    blockchain:  blockNumber ? `connected (block #${blockNumber})` : "not connected",
  });
});

// ── 404 handler ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── WebSocket — live blockchain event feed ────────────────────────────
const EVENT_TYPES = ["FEE_PAYMENT", "TOKEN_MINT", "SMART_CTR", "P2P_XFER", "ADMIN_ACL", "TICKET_MINT"];
const EVENT_DESCS = [
  "Fee payment processed for Rahul Sharma",
  "CampusCoin minted to student wallet",
  "Smart contract policy updated",
  "P2P transfer between students",
  "Admin ACL rule applied",
  "NFT event ticket minted",
];

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Send live block feed every 7s
  const interval = setInterval(async () => {
    const blockNum = (await web3.getLatestBlock()) || Math.floor(Date.now() / 4000);
    const idx      = Math.floor(Math.random() * EVENT_TYPES.length);
    socket.emit("blockchain:event", {
      type:        EVENT_TYPES[idx],
      description: EVENT_DESCS[idx],
      blockNumber: blockNum,
      finalityMs:  Math.floor(Math.random() * 800) + 1200,
      timestamp:   new Date().toISOString(),
    });
  }, 7000);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuschain");
    console.log("✅ MongoDB connected");

    // Blockchain
    web3.init();

    // IPFS
    ipfs.init();

    server.listen(PORT, () => {
      console.log(`\n🚀 CampusChain backend running on http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

start();
