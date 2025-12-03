// backend/routes/period.js
const express = require("express");
const router = express.Router();
const PeriodEntry = require("../models/PeriodEntry");
const { requireAuth } = require("../middleware/auth");

/* ============================================================
   1) LOG PERIOD START (voice + UI)
   POST /api/period/start
============================================================ */
router.post("/start", requireAuth, async (req, res) => {
  try {
    const today = new Date();

    // Check if there is an active period not closed yet
    const lastEntry = await PeriodEntry.findOne({
      user: req.user._id,
    }).sort({ startDate: -1 });

    if (lastEntry && !lastEntry.endDate) {
      return res.json({
        message: "Your previous period entry is still active.",
        entry: lastEntry,
      });
    }

    const entry = await PeriodEntry.create({
      user: req.user._id,
      startDate: today,
      flow: req.body.flow || "medium",
      notes: req.body.notes || "",
    });

    res.json({
      message: "Period start logged successfully.",
      entry,
    });
  } catch (err) {
    console.error("Period start error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   2) LOG PERIOD END (voice + UI)
   POST /api/period/end
============================================================ */
router.post("/end", requireAuth, async (req, res) => {
  try {
    const today = new Date();

    const lastEntry = await PeriodEntry.findOne({
      user: req.user._id,
    }).sort({ startDate: -1 });

    if (!lastEntry)
      return res.status(404).json({ error: "No active period to end." });

    if (lastEntry.endDate)
      return res.json({
        message: "Your last period was already ended.",
        entry: lastEntry,
      });

    lastEntry.endDate = today;
    await lastEntry.save();

    res.json({
      message: "Period ended successfully.",
      entry: lastEntry,
    });
  } catch (err) {
    console.error("Period end error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3) MANUAL ENTRY (UI only)
   POST /api/period/entry
============================================================ */
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

    res.json({
      message: "Entry saved.",
      entry,
    });
  } catch (err) {
    console.error("Manual period entry error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   4) HISTORY
   GET /api/period/history
============================================================ */
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
