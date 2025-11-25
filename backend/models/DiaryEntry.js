// backend/models/DiaryEntry.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DiaryEntrySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  text: { type: String, required: true },
  mood: { type: String }, // e.g. 'happy','anxious','sad','neutral'
  private: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DiaryEntry", DiaryEntrySchema);
