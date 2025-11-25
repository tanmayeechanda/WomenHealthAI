// backend/models/PeriodEntry.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PeriodEntrySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  flow: {
    type: String,
    enum: ["light", "moderate", "heavy"],
    default: "moderate",
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PeriodEntry", PeriodEntrySchema);
