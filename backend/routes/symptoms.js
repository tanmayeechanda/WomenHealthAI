// backend/routes/symptoms.js
const express = require("express");
const router = express.Router();
const SymptomEntry = require("../models/SymptomEntry");
const { requireAuth } = require("../middleware/auth");

/* ============================================================
   Create symptom log entry
   POST /api/symptoms/entry
============================================================ */
router.post("/entry", requireAuth, async (req, res) => {
  try {
    const { symptom, severity, notes, cyclePhase, dateTime } = req.body;

    if (!symptom || !symptom.trim()) {
      return res.status(400).json({ error: "Symptom description required" });
    }

    const entry = await SymptomEntry.create({
      user: req.user._id,
      symptom: symptom.trim(),
      severity: severity || 3,
      notes,
      cyclePhase,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
    });

    res.json({ message: "Symptom logged", entry });
  } catch (err) {
    console.error("Symptom log error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   Get symptom entries (latest first)
   GET /api/symptoms/entries
============================================================ */
router.get("/entries", requireAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const items = await SymptomEntry.find({ user: req.user._id })
      .sort({ dateTime: -1 })
      .limit(Number(limit));

    res.json(items);
  } catch (err) {
    console.error("Symptom fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
