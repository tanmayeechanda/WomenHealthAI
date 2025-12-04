// backend/models/DiaryEntry.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const DiaryEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // The calendar day the entry belongs to
    date: { type: Date, required: true, default: Date.now },

    // Optional title
    title: { type: String, trim: true },

    // Main diary text
    text: { type: String, required: true },

    // e.g. 'happy', 'anxious', 'sad', 'neutral', 'angry', 'tired'
    mood: { type: String, trim: true },

    // High-level theme
    category: {
      type: String,
      trim: true,
      default: "Daily Reflection",
    },

    // Cycle phase tag
    cyclePhase: {
      type: String,
      trim: true,
      default: "Not sure",
    },

    // Special pictures for that day (paths like /uploads/diary/xxx.jpg)
    photos: [{ type: String }],

    // Extra private entry (UI can show a lock icon)
    private: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model("DiaryEntry", DiaryEntrySchema);
