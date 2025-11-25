// backend/routes/diary.js
const express = require("express");
const router = express.Router();
const DiaryEntry = require("../models/DiaryEntry");
const { requireAuth } = require("../middleware/auth");

// POST /api/diary/entry
router.post("/entry", requireAuth, async (req, res) => {
  try {
    const { date, text, mood, private: isPrivate } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ error: "Text required" });
    const d = date ? new Date(date) : new Date();
    const entry = await DiaryEntry.create({
      user: req.user._id,
      date: d,
      text,
      mood,
      private: !!isPrivate,
    });
    res.json(entry);
  } catch (err) {
    console.error("Diary save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/diary/entries?from=&to=
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
