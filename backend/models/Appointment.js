// backend/models/Appointment.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  doctorName: { type: String, required: true },
  specialty: { type: String }, // e.g. "Gynecologist"
  location: { type: String }, // clinic / hospital / city

  dateTime: { type: Date, required: true },

  notes: { type: String },

  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled"],
    default: "upcoming",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
