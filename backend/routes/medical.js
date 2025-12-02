// backend/routes/medical.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const MedicalReport = require("../models/MedicalReport");

// 🔹 Multer storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // folder: backend/uploads/reports
    cb(null, path.join(__dirname, "..", "uploads", "reports"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_"); // replace spaces
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * POST /api/medical/report
 * Create a medical report WITH file upload.
 * Expects multipart/form-data:
 *  - title (string, required)
 *  - date (string, required)
 *  - doctorName (string, optional)
 *  - hospital (string, optional)
 *  - notes (string, optional)
 *  - file (file, required)
 */
router.post(
  "/report",
  requireAuth,
  upload.single("file"), // field name: "file"
  async (req, res) => {
    try {
      const { title, date, doctorName, hospital, notes } = req.body;

      if (!title || !date) {
        return res.status(400).json({ error: "Title and date are required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Report file is required" });
      }

      const report = await MedicalReport.create({
        user: req.user._id,
        title,
        date: new Date(date),
        doctorName,
        hospital,
        notes,

        filePath: `/uploads/reports/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      res.json(report);
    } catch (err) {
      console.error("Medical report save error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/medical/reports – list user’s reports
router.get("/reports", requireAuth, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ user: req.user._id }).sort({
      date: -1,
    });
    res.json(reports);
  } catch (err) {
    console.error("Medical report fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
