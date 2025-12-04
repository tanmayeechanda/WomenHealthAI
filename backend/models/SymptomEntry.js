// backend/models/SymptomEntry.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const SymptomEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // When this symptom was felt
    dateTime: { type: Date, default: Date.now },

    // e.g. "cramps", "bloating", "headache", "low mood"
    symptom: { type: String, required: true, trim: true },

    // 1–5 simple severity
    severity: { type: Number, min: 1, max: 5, default: 3 },

    // phase at that time (optional, we’ll fill from current phase if we know it)
    cyclePhase: { type: String, trim: true }, // "period" | "follicular" | "ovulation" | "luteal"

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SymptomEntry", SymptomEntrySchema);
