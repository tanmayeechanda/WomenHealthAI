// backend/routes/wellness.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const WellnessProfile = require("../models/WellnessProfile");
const PeriodEntry = require("../models/PeriodEntry");

// ===== file upload setup =====
const uploadDir = path.join(__dirname, "..", "uploads", "reports");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

// ===== helper: compute cycle info from period history =====
async function computeCycleFromHistory(userId) {
  const lastPeriods = await PeriodEntry.find({ user: userId })
    .sort({ startDate: -1 })
    .limit(5);

  if (!lastPeriods.length) {
    return {
      cycleDay: null,
      inPeriodNow: false,
      currentCyclePhase: "unknown",
    };
  }

  const latest = lastPeriods[0];
  const today = new Date();
  const start = new Date(latest.startDate);
  const msDiff = today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1; // day 1 = start date

  if (dayDiff <= 0) {
    return {
      cycleDay: null,
      inPeriodNow: false,
      currentCyclePhase: "unknown",
    };
  }

  // estimate cycle length from history or default 28
  let avgCycleLength = 28;
  if (lastPeriods.length >= 2) {
    const lengths = [];
    for (let i = 0; i < lastPeriods.length - 1; i++) {
      const curr = new Date(lastPeriods[i].startDate);
      const prev = new Date(lastPeriods[i + 1].startDate);
      const diff = Math.floor(
        (curr.setHours(0, 0, 0, 0) - prev.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );
      if (diff > 10 && diff < 60) lengths.push(diff);
    }
    if (lengths.length) {
      avgCycleLength = Math.round(
        lengths.reduce((a, b) => a + b, 0) / lengths.length
      );
    }
  }

  const cycleDay =
    dayDiff > avgCycleLength ? ((dayDiff - 1) % avgCycleLength) + 1 : dayDiff;

  // simple phase mapping
  let phase = "luteal";
  if (cycleDay >= 1 && cycleDay <= 5) phase = "menstrual";
  else if (cycleDay >= 6 && cycleDay <= 13) phase = "follicular";
  else if (cycleDay >= 14 && cycleDay <= 16) phase = "ovulatory";
  else phase = "luteal";

  // check if currently in bleeding range (using stored endDate if present)
  let inPeriodNow = false;
  if (latest.endDate) {
    const end = new Date(latest.endDate);
    inPeriodNow =
      today.setHours(0, 0, 0, 0) >=
        new Date(latest.startDate).setHours(0, 0, 0, 0) &&
      today.setHours(0, 0, 0, 0) <= end.setHours(0, 0, 0, 0);
  } else {
    // assume first 5 days of the cycle are period if endDate missing
    inPeriodNow = cycleDay >= 1 && cycleDay <= 5;
  }

  return { cycleDay, inPeriodNow, currentCyclePhase: phase };
}

// ===== GET /api/wellness/me =====
router.get("/me", requireAuth, async (req, res) => {
  try {
    let profile = await WellnessProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = await WellnessProfile.create({ user: req.user._id });
    }

    // auto-guess cycle from period history
    const autoCycle = await computeCycleFromHistory(req.user._id);

    // update stored fields (but don't await save, to keep it fast)
    profile.currentCyclePhase = autoCycle.currentCyclePhase;
    profile.inPeriodNow = autoCycle.inPeriodNow;
    profile.cycleDay = autoCycle.cycleDay;
    profile.save().catch(() => {});

    // appointment reminder logic: within 7 days & less than 2 reminders
    let appointmentReminder = null;
    if (profile.nextAppointmentDate) {
      const today = new Date();
      const appt = new Date(profile.nextAppointmentDate);
      const msDiff = appt.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
      const daysLeft = Math.floor(msDiff / (1000 * 60 * 60 * 24));

      if (daysLeft >= 0 && daysLeft <= 7) {
        if ((profile.appointmentReminderCount || 0) < 2) {
          appointmentReminder = {
            daysLeft,
            message: `You have an appointment in ${daysLeft} day(s).`,
          };
          profile.appointmentReminderCount =
            (profile.appointmentReminderCount || 0) + 1;
          profile.appointmentReminderLastShown = new Date();
          profile.save().catch(() => {});
        }
      }
    }

    const plain = profile.toObject();
    plain.appointmentReminder = appointmentReminder;

    return res.json(plain);
  } catch (err) {
    console.error("Wellness /me error:", err);
    return res.status(500).json({ error: "Failed to fetch wellness profile" });
  }
});

// ===== POST /api/wellness (save text + appointment) =====
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      dos,
      donts,
      medicalConditions,
      extraNotes,
      nextAppointmentDate,
      nextAppointmentDoctor,
      nextAppointmentLocation,
      nextAppointmentNotes,
    } = req.body;

    const update = {
      user: req.user._id,
      dos,
      donts,
      medicalConditions,
      extraNotes,
      nextAppointmentDoctor,
      nextAppointmentLocation,
      nextAppointmentNotes,
    };

    if (nextAppointmentDate) {
      update.nextAppointmentDate = new Date(nextAppointmentDate);
      // reset reminders when appointment changes
      update.appointmentReminderCount = 0;
      update.appointmentReminderLastShown = null;
    }

    const profile = await WellnessProfile.findOneAndUpdate(
      { user: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(profile);
  } catch (err) {
    console.error("Wellness POST error:", err);
    return res.status(500).json({ error: "Failed to save wellness profile" });
  }
});

// ===== POST /api/wellness/report (upload report) =====
router.post("/report", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/reports/${req.file.filename}`;

    const profile = await WellnessProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $setOnInsert: { user: req.user._id },
        $push: {
          medicalReports: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: fileUrl,
          },
        },
      },
      { new: true, upsert: true }
    );

    return res.json(profile);
  } catch (err) {
    console.error("Report upload error:", err);
    return res.status(500).json({ error: "Failed to upload report" });
  }
});

module.exports = router;
