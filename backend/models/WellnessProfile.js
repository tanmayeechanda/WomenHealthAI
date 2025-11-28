// backend/models/WellnessProfile.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wellnessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    // these will be auto-guessed, but still stored for manual override if needed
    currentCyclePhase: {
      type: String,
      enum: ["menstrual", "follicular", "ovulatory", "luteal", "unknown"],
      default: "unknown",
    },
    inPeriodNow: { type: Boolean, default: false },
    cycleDay: { type: Number, min: 1, max: 40 },

    // personal rules
    dos: { type: String },
    donts: { type: String },

    // medical history text
    medicalConditions: { type: String },
    extraNotes: { type: String },

    // next doctor appointment
    nextAppointmentDate: { type: Date },
    nextAppointmentDoctor: { type: String },
    nextAppointmentLocation: { type: String },
    nextAppointmentNotes: { type: String },

    // basic reminder tracking (how many times we reminded)
    appointmentReminderCount: { type: Number, default: 0 },
    appointmentReminderLastShown: { type: Date },

    // uploaded reports
    medicalReports: [reportSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WellnessProfile", wellnessProfileSchema);
