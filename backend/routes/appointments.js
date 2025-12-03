// backend/routes/appointments.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Appointment = require("../models/Appointment");

/* ============================================================
   Helper: Convert natural speech to Date() 
   Example: "on 5 December", "December 5", "5th January"
============================================================ */
function extractDate(text) {
  // Match formats like:
  // “5 December”, “December 5”, “5th January”, “on 12 Feb”
  const naturalDateRegex =
    /(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*)|((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?)/gi;

  const match = text.match(naturalDateRegex);
  if (!match) return null;

  // Convert matched string to JS Date
  const date = new Date(match[0]);
  if (isNaN(date.getTime())) return null;

  return date;
}

/* ============================================================
   1) VOICE: Create Appointment
   POST /api/appointments/voice
   Example voice commands:
   - "Book appointment on 5 December"
   - "Schedule appointment on January 10"
============================================================ */
router.post("/voice", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Message required" });

    const extractedDate = extractDate(text);
    const dateTime = extractedDate || new Date(Date.now() + 86400000); // default: next day

    const appt = await Appointment.create({
      user: req.user._id,
      doctorName: "Doctor",
      specialty: "General Consultation",
      location: "Not provided",
      dateTime,
      notes: `Voice-created: ${text}`,
      status: "upcoming",
    });

    return res.json({
      message: "Appointment created via voice",
      appointment: appt,
    });
  } catch (err) {
    console.error("Voice appointment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   2) CREATE Appointment (UI)
   POST /api/appointments
============================================================ */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { doctorName, specialty, location, dateTime, notes } = req.body;
    if (!doctorName || !dateTime) {
      return res
        .status(400)
        .json({ error: "Doctor name and date/time required" });
    }

    const appt = await Appointment.create({
      user: req.user._id,
      doctorName,
      specialty,
      location,
      dateTime: new Date(dateTime),
      notes,
      status: "upcoming",
    });

    res.json({
      message: "Appointment created",
      appointment: appt,
    });
  } catch (err) {
    console.error("Appointment save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3) GET NEXT Upcoming Appointment
   GET /api/appointments/next
============================================================ */
router.get("/next", requireAuth, async (req, res) => {
  try {
    const now = new Date();

    let next = await Appointment.findOne({
      user: req.user._id,
      dateTime: { $gte: now },
      status: "upcoming",
    }).sort({ dateTime: 1 });

    res.json(next || null);
  } catch (err) {
    console.error("Appointment next error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   4) LIST ALL
   GET /api/appointments
============================================================ */
router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await Appointment.find({ user: req.user._id }).sort({
      dateTime: 1,
    });

    res.json(list);
  } catch (err) {
    console.error("Appointment list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
