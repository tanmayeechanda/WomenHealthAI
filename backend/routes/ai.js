// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

// Models for voice actions
const PeriodEntry = require("../models/PeriodEntry");
const DiaryEntry = require("../models/DiaryEntry");
const Appointment = require("../models/Appointment");

/* ============================================================
   File Upload Setup (Already correct)
============================================================ */
const aiUploadsDir = path.join(__dirname, "..", "uploads", "ai-reports");
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, aiUploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-ai-${baseName}${ext}`);
  },
});
const upload = multer({ storage });

/* ============================================================
   1️⃣ INTENT DETECTOR (Brain of your Assistant)
============================================================ */
function detectIntent(text) {
  const t = text.toLowerCase();

  if (t.includes("start my period")) return "period_start";
  if (t.includes("end my period")) return "period_end";

  if (t.includes("write in my diary")) return "diary_write";
  if (t.includes("add to my diary")) return "diary_write";

  if (t.includes("next appointment")) return "appointment_next";
  if (t.includes("book appointment")) return "appointment_create";
  if (t.includes("schedule appointment")) return "appointment_create";

  if (
    t.includes("cramp") ||
    t.includes("pain") ||
    t.includes("bloating") ||
    t.includes("acidity")
  )
    return "symptom";

  if (t.includes("i feel") || t.includes("i am") || t.includes("feeling"))
    return "mood";

  return "chat"; // fallback
}

/* ============================================================
   2️⃣ NATURAL DATE EXTRACTOR FOR APPOINTMENTS
============================================================ */
const naturalDateRegex =
  /(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)|((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?)/gi;

function extractDate(text) {
  const match = text.match(naturalDateRegex);
  if (!match) return null;
  const d = new Date(match[0]);
  return isNaN(d.getTime()) ? null : d;
}

/* ============================================================
   3️⃣ MAIN CHAT ENDPOINT — NOW WITH SMART INTENT ENGINE
============================================================ */
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    const intent = detectIntent(content);

    /* --------------- PERIOD START -------------- */
    if (intent === "period_start") {
      const today = new Date();

      const lastEntry = await PeriodEntry.findOne({
        user: req.user._id,
      }).sort({ startDate: -1 });

      if (lastEntry && !lastEntry.endDate) {
        return res.json({
          text: "Your previous period entry is still active.",
        });
      }

      await PeriodEntry.create({
        user: req.user._id,
        startDate: today,
      });

      return res.json({
        text: "I marked today as your period start.",
      });
    }

    /* --------------- PERIOD END ---------------- */
    if (intent === "period_end") {
      const today = new Date();

      const lastEntry = await PeriodEntry.findOne({
        user: req.user._id,
      }).sort({ startDate: -1 });

      if (!lastEntry)
        return res.json({ text: "You do not have any active period." });

      if (lastEntry.endDate)
        return res.json({ text: "Your last period is already ended." });

      lastEntry.endDate = today;
      await lastEntry.save();

      return res.json({ text: "I ended your current period entry." });
    }

    /* --------------- DIARY ENTRY ---------------- */
    if (intent === "diary_write") {
      const entry = await DiaryEntry.create({
        user: req.user._id,
        text: content,
        date: new Date(),
      });

      return res.json({
        text: "I added this to your diary.",
      });
    }

    /* --------------- NEXT APPOINTMENT ----------- */
    if (intent === "appointment_next") {
      const now = new Date();

      const appt = await Appointment.findOne({
        user: req.user._id,
        dateTime: { $gte: now },
        status: "upcoming",
      }).sort({ dateTime: 1 });

      if (!appt)
        return res.json({
          text: "You do not have any upcoming appointments.",
        });

      return res.json({
        text: `Your next appointment is on ${new Date(
          appt.dateTime
        ).toDateString()}.`,
      });
    }

    /* --------------- CREATE APPOINTMENT --------- */
    if (intent === "appointment_create") {
      const date = extractDate(content) || new Date(Date.now() + 86400000);

      const appt = await Appointment.create({
        user: req.user._id,
        doctorName: "Doctor",
        specialty: "General Checkup",
        dateTime: date,
        notes: "Created via voice",
        status: "upcoming",
      });

      return res.json({
        text: `Appointment created for ${date.toDateString()}.`,
      });
    }

    /* --------------- SYMPTOM HELP ---------------- */
    if (intent === "symptom") {
      return res.json({
        text: "It sounds like you're uncomfortable. Try using a warm water bag, staying hydrated, and resting. If pain is severe, please see a doctor.",
      });
    }

    /* --------------- MOOD SUPPORT ---------------- */
    if (intent === "mood") {
      return res.json({
        text: "I'm here with you. It's okay to feel this way. Want to talk more about what you’re feeling?",
      });
    }

    /* --------------- DEFAULT CHAT ---------------- */
    const fallbackReply = `I hear you. "${content}". Tell me more, I am here for you.`;

    return res.json({ text: fallbackReply });
  } catch (err) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* Existing mood, report, doctor, remedy endpoints (unchanged) */
router.post("/mood-suggestions", requireAuth, async (req, res) => {
  /* ... keep your same code ... */
});

router.post("/report-explain", requireAuth, async (req, res) => {
  /* ... keep your same code ... */
});

router.post(
  "/report-explain-file",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    /* ... keep your same code ... */
  }
);

router.post("/doctor-suggest", requireAuth, async (req, res) => {
  /* ... keep your same code ... */
});

router.post("/remedy-suggest", requireAuth, async (req, res) => {
  /* ... keep your same code ... */
});

module.exports = router;
