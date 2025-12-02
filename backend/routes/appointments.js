// backend/routes/appointments.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Appointment = require("../models/Appointment");

// POST /api/appointments – create appointment
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
    });
    res.json(appt);
  } catch (err) {
    console.error("Appointment save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/appointments/next – get next upcoming appointment
router.get("/next", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const appt = await Appointment.findOne({
      user: req.user._id,
      dateTime: { $gte: now },
      status: "upcoming",
    }).sort({ dateTime: 1 });
    res.json(appt || null);
  } catch (err) {
    console.error("Appointment next error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/appointments – list all
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
