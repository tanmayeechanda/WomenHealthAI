// backend/routes/diary.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const DiaryEntry = require("../models/DiaryEntry");
const { requireAuth } = require("../middleware/auth");

/* ========= Multer setup for diary photos ========= */
const diaryUploadDir = path.join(__dirname, "..", "uploads", "diary");
if (!fs.existsSync(diaryUploadDir)) {
  fs.mkdirSync(diaryUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, diaryUploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // up to 5 photos per entry
  },
});

/* ============================================================
   1) VOICE ENTRY – for "write in my diary"
   POST /api/diary/voice
============================================================ */
router.post("/voice", requireAuth, async (req, res) => {
  try {
    const {
      text,
      title,
      mood: explicitMood,
      category,
      cyclePhase,
      private: isPrivate,
      date,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Diary text required" });
    }

    // auto-mood detection (fallback)
    let mood = explicitMood || "neutral";
    if (!explicitMood) {
      const lower = text.toLowerCase();
      if (lower.includes("happy") || lower.includes("good")) mood = "happy";
      if (lower.includes("sad") || lower.includes("upset")) mood = "sad";
      if (lower.includes("angry") || lower.includes("frustrated"))
        mood = "angry";
      if (
        lower.includes("anxious") ||
        lower.includes("stress") ||
        lower.includes("worried")
      ) {
        mood = "anxious";
      }
    }

    const entry = await DiaryEntry.create({
      user: req.user._id,
      date: date ? new Date(date) : new Date(),
      title: title || undefined,
      text,
      mood,
      category: category || "Daily Reflection",
      cyclePhase: cyclePhase || "Not sure",
      private: typeof isPrivate === "boolean" ? isPrivate : false,
      photos: [], // voice route doesn't handle photos
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
   2) MANUAL ENTRY – UI form (with optional photos)
   POST /api/diary/entry
   Content-Type: multipart/form-data
   fields: text, title, date, mood, category, cyclePhase, private, photos[]
============================================================ */
router.post(
  "/entry",
  requireAuth,
  upload.array("photos", 5),
  async (req, res) => {
    try {
      const {
        date,
        text,
        mood,
        private: isPrivate,
        title,
        category,
        cyclePhase,
      } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Diary text required" });
      }

      const photos = (req.files || []).map((file) => {
        // saved as /uploads/diary/filename.ext
        return `/uploads/diary/${file.filename}`;
      });

      const entry = await DiaryEntry.create({
        user: req.user._id,
        date: date ? new Date(date) : new Date(),
        title: title || undefined,
        text,
        mood: mood || "neutral",
        category: category || "Daily Reflection",
        cyclePhase: cyclePhase || "Not sure",
        private:
          typeof isPrivate === "boolean"
            ? isPrivate
            : isPrivate === "false"
            ? false
            : true,
        photos,
      });

      res.json({
        message: "Diary saved successfully",
        entry,
      });
    } catch (err) {
      console.error("Diary save error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

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

    const items = await DiaryEntry.find(q).sort({ date: -1, createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error("Diary fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   4) FETCH SINGLE ENTRY – detail view / editing
   GET /api/diary/entry/:id
============================================================ */
router.get("/entry/:id", requireAuth, async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (err) {
    console.error("Diary single fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   5) UPDATE ENTRY – text fields only for now
   PUT /api/diary/entry/:id
============================================================ */
router.put("/entry/:id", requireAuth, async (req, res) => {
  try {
    const {
      date,
      text,
      mood,
      private: isPrivate,
      title,
      category,
      cyclePhase,
    } = req.body;

    if (text && !text.trim()) {
      return res.status(400).json({ error: "Diary text cannot be empty" });
    }

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (typeof text === "string") updateData.text = text;
    if (typeof title === "string") updateData.title = title;
    if (typeof mood === "string") updateData.mood = mood;
    if (typeof category === "string") updateData.category = category;
    if (typeof cyclePhase === "string") updateData.cyclePhase = cyclePhase;
    if (typeof isPrivate === "boolean") updateData.private = isPrivate;

    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({
      message: "Diary entry updated",
      entry,
    });
  } catch (err) {
    console.error("Diary update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   6) DELETE ENTRY
   DELETE /api/diary/entry/:id
============================================================ */
router.delete("/entry/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await DiaryEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Diary entry deleted" });
  } catch (err) {
    console.error("Diary delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
