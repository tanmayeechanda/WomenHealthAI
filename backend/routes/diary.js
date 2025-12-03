// backend/routes/diary.js
const express = require("express");
const router = express.Router();
const DiaryEntry = require("../models/DiaryEntry");
const { requireAuth } = require("../middleware/auth");

/* ============================================================
   1) VOICE ENTRY – for "write in my diary"
   POST /api/diary/voice
============================================================ */
router.post("/voice", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Diary text required" });
    }

    // optional auto-mood detection placeholder
    let mood = "neutral";
    const lower = text.toLowerCase();
    if (lower.includes("happy") || lower.includes("good")) mood = "happy";
    if (lower.includes("sad") || lower.includes("upset")) mood = "sad";
    if (lower.includes("angry") || lower.includes("frustrated")) mood = "angry";
    if (
      lower.includes("anxious") ||
      lower.includes("stress") ||
      lower.includes("worried")
    )
      mood = "anxious";

    const entry = await DiaryEntry.create({
      user: req.user._id,
      date: new Date(),
      text,
      mood,
      private: false,
    });

    res.json({
      message: "Diary entry saved",
      entry,
    });
  } catch (err) {
    console.error("Voice diary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   2) MANUAL ENTRY – UI form
   POST /api/diary/entry
============================================================ */
router.post("/entry", requireAuth, async (req, res) => {
  try {
    const { date, text, mood, private: isPrivate } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Diary text required" });
    }

    const entry = await DiaryEntry.create({
      user: req.user._id,
      date: date ? new Date(date) : new Date(),
      text,
      mood: mood || "neutral",
      private: !!isPrivate,
    });

    res.json({
      message: "Diary saved successfully",
      entry,
    });
  } catch (err) {
    console.error("Diary save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3) FETCH ENTRIES – used by UI
   GET /api/diary/entries
============================================================ */
router.get("/entries", requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = { user: req.user._id };

    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);

    const items = await DiaryEntry.find(q).sort({ date: -1 });

    res.json(items);
  } catch (err) {
    console.error("Diary fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
