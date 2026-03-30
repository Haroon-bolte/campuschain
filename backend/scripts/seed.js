require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const User = require("../src/models/User");
const Fee = require("../src/models/Fee");
const Event = require("../src/models/Event");
const Transaction = require("../src/models/Transaction");
const Dispute = require("../src/models/Dispute");
const Policy = require("../src/models/Policy");
const AuditLog = require("../src/models/AuditLog");

const JSON_PATH = path.join(__dirname, "../../campusfrontend/database.json");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuschain");
    console.log("✅ Connected to MongoDB");

    // Clear existing
    await User.deleteMany({});
    await Fee.deleteMany({});
    await Event.deleteMany({});
    await Transaction.deleteMany({});
    await Dispute.deleteMany({});
    await Policy.deleteMany({});
    await AuditLog.deleteMany({});
    console.log("🗑️ Cleared existing collections");

    const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPw = await bcrypt.hash("admin123", salt);
    const hashedStudentPw = await bcrypt.hash("student123", salt);

    const usersToInsert = data.users.map(u => ({
      name: u.name,
      email: u.email,
      password: u.role === "Admin" ? hashedAdminPw : hashedStudentPw,
      role: u.role,
      walletAddress: u.wallet ? u.wallet.toLowerCase() : undefined,
      status: u.status,
      dept: u.dept,
      rollNo: u.rollNo,
      semester: u.sem
    }));
    await User.insertMany(usersToInsert);
    console.log(`👤 Seeded ${usersToInsert.length} users`);

    // 2. Seed Fees
    const feesToInsert = data.fees.map(f => ({
      sid: f.sid,
      sname: f.sname,
      cat: f.cat,
      amount: f.amount,
      due: new Date(f.due),
      status: f.status,
      txHash: f.txHash,
      paidAt: f.paidAt ? new Date(f.paidAt) : undefined
    }));
    await Fee.insertMany(feesToInsert);
    console.log(`💳 Seeded ${feesToInsert.length} fees`);

    // 3. Seed Events
    const eventsToInsert = data.events.map(e => ({
      name: e.name,
      date: e.date,
      venue: e.venue,
      price: e.price,
      cap: e.cap,
      sold: e.sold,
      status: e.status,
      desc: e.desc
    }));
    await Event.insertMany(eventsToInsert);
    console.log(`🎟️ Seeded ${eventsToInsert.length} events`);

    // 4. Seed Transactions
    const txnsToInsert = data.txns.map(t => ({
      hash: t.hash,
      type: t.type,
      from: t.sname, // Using sname as 'from' for now as placeholder
      to: t.service, // Using service as 'to' for placeholder
      amount: t.amount,
      status: t.status,
      service: t.service,
      timestamp: new Date(t.ts),
      blockNumber: t.block
    }));
    await Transaction.insertMany(txnsToInsert);
    console.log(`🔄 Seeded ${txnsToInsert.length} transactions`);

    // 5. Seed Disputes
    const disputesToInsert = data.disputes.map(d => ({
      sname: d.sname,
      reason: d.reason,
      amount: d.amount,
      pri: d.pri,
      raised: new Date(d.raised),
      status: d.status,
      resolvedAt: d.resolvedAt ? new Date(d.resolvedAt) : undefined
    }));
    await Dispute.insertMany(disputesToInsert);
    console.log(`⚖️ Seeded ${disputesToInsert.length} disputes`);

    // 6. Seed Policies
    const policiesToInsert = data.policies.map(p => ({
      name: p.name,
      val: p.val,
      unit: p.unit,
      enabled: p.enabled,
      desc: p.desc
    }));
    await Policy.insertMany(policiesToInsert);
    console.log(`⚙️ Seeded ${policiesToInsert.length} policies`);

    // 7. Seed Audit Log
    const auditToInsert = data.audit.map(a => ({
      action: a.action,
      actor: a.actor,
      details: a.detail,
      timestamp: new Date(a.ts),
      blockNumber: a.block,
      txHash: a.hash
    }));
    await AuditLog.insertMany(auditToInsert);
    console.log(`📋 Seeded ${auditToInsert.length} audit logs`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
