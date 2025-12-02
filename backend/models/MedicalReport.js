// backend/models/MedicalReport.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MedicalReportSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // e.g. "Blood Test - Jan 2025"
  title: { type: String, required: true },

  // Date of the test / visit
  date: { type: Date, required: true },

  doctorName: { type: String }, // optional
  hospital: { type: String }, // optional

  // User-written summary / what doctor said
  notes: { type: String },

  // 🔹 File-related fields
  filePath: { type: String, required: true }, // e.g. /uploads/reports/xyz.pdf
  originalName: { type: String, required: true }, // original filename
  mimeType: { type: String, required: true }, // e.g. application/pdf
  size: { type: Number, required: true }, // in bytes

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MedicalReport", MedicalReportSchema);
