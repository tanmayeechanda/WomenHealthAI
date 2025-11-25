// backend/routes/period.js
const express = require("express");
const router = express.Router();
const PeriodEntry = require("../models/PeriodEntry");
const { requireAuth } = require("../middleware/auth");

// POST /api/period/entry
router.post("/entry", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, flow, notes } = req.body;
    const entry = await PeriodEntry.create({
      user: req.user._id,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      flow,
      notes,
    });
    res.json(entry);
  } catch (err) {
    console.error("Period entry error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/period/history?from=&to=
router.get("/history", requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = { user: req.user._id };
    if (from || to) q.startDate = {};
    if (from) q.startDate.$gte = new Date(from);
    if (to) q.startDate.$lte = new Date(to);
    const items = await PeriodEntry.find(q).sort({ startDate: -1 });
    res.json(items);
  } catch (err) {
    console.error("Period history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
