// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

// If you later use OpenAI, import it here:
// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ============================================================
   MULTER SETUP FOR FILE-BASED REPORT EXPLANATION
   Files will be stored in: backend/uploads/ai-reports
============================================================ */
const aiUploadsDir = path.join(__dirname, "..", "uploads", "ai-reports");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, aiUploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_"); // replace spaces with _
    cb(null, `${Date.now()}-ai-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

/* ============================================================
   1) AI TEXT CHAT ENDPOINT
   POST /api/ai/chat
   You can connect this to OpenAI or send rule-based replies.
============================================================ */
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Simple safe empathetic fallback (no external AI needed)
    const reply = `I hear you. "${content}". I'm here to listen and support you. You're not alone. Tell me more about how you're feeling.`;

    return res.json({ text: reply });

    // Later: Replace with real OpenAI call like:
    /**
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a gentle women's health assistant. Avoid medical diagnosis." },
        { role: "user", content }
      ]
    });
    res.json({ text: completion.choices[0].message.content });
    **/
  } catch (err) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   2) MOOD SUGGESTIONS ENDPOINT
   POST /api/ai/mood-suggestions
   Returns mood-based actions + cycle-based food tips
============================================================ */
router.post("/mood-suggestions", requireAuth, async (req, res) => {
  try {
    const { mood, cyclePhase, restrictions } = req.body || {};

    const actionsByMood = {
      anxious: [
        "Try 5-minute box breathing: inhale 4s, hold 4s, exhale 4s.",
        "Grounding method: name 5 things you see, 4 things you can touch, 3 things you hear.",
        "Take a short walk or stretch gently.",
      ],
      sad: [
        "Write down 3 things you are grateful for today.",
        "Listen to calming music you like.",
        "Talk to someone you trust or take a peaceful walk.",
      ],
      angry: [
        "Try progressive muscle relaxation.",
        "Step away for 5 minutes, take 3 slow deep breaths.",
        "Write your feelings on paper then close it.",
      ],
      calm: [
        "Continue your calming routine and hydrate.",
        "A short mindfulness check-in can help refresh your mind.",
        "Light stretching or yoga for balance.",
      ],
      neutral: [
        "Drink water and take a small break.",
        "Do one tiny activity you enjoy.",
        "Stretch for 2 minutes.",
      ],
    };

    const foodByPhase = {
      period: [
        "Iron-rich foods: spinach, lentils, tofu.",
        "Ginger tea to ease cramps.",
        "Oats or sweet potatoes for energy.",
      ],
      follicular: [
        "High-protein meals with veggies.",
        "Berries and leafy greens.",
        "Nuts and seeds for energy.",
      ],
      ovulation: [
        "Pumpkin seeds, eggs, or nuts for zinc.",
        "Healthy fats like avocado.",
        "High-fiber fruits.",
      ],
      luteal: [
        "Magnesium foods: bananas, nuts, dark chocolate.",
        "Warm herbal teas.",
        "Sweet potato for steady energy.",
      ],
    };

    const chosenMood = (mood || "neutral").toLowerCase();
    const chosenPhase = (cyclePhase || "period").toLowerCase();

    let actions = actionsByMood[chosenMood] || actionsByMood["neutral"];
    let foods = foodByPhase[chosenPhase] || foodByPhase["period"];

    // Basic dietary restriction filtering
    if (restrictions && typeof restrictions === "string") {
      if (/vegan/i.test(restrictions)) {
        foods = foods.map((f) =>
          f.replace(/eggs|fish|dairy/gi, "plant-based alternatives")
        );
      }
    }

    return res.json({
      actions,
      foods,
      checkin:
        "If you ever feel severe pain, extremely heavy bleeding, or suicidal thoughts, please seek immediate medical help.",
    });
  } catch (err) {
    console.error("Mood Suggestion Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3) REPORT EXPLANATION (TEXT-BASED, OPTIONAL)
   POST /api/ai/report-explain
   Explains report text in simple language, but never diagnoses.
   👉 You can keep this for copy-paste text if you want.
============================================================ */
router.post("/report-explain", requireAuth, async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText || !reportText.trim()) {
      return res.status(400).json({ error: "Report text is required" });
    }

    // Simple, safe explanation template (no diagnosis)
    const explanation =
      "I can’t diagnose from this report, but here are some general pointers:\n\n" +
      "- Lab reports usually show a value and a normal range for each marker.\n" +
      "- Terms like Hb, RBC, WBC, TSH, etc. are different tests about blood or hormones.\n" +
      "- Anything marked as 'high' or 'low' should be discussed with your doctor.\n\n" +
      "Please use this to understand terms in simple language, but always follow your doctor's advice. " +
      "If you paste specific words (like 'TSH', 'HbA1c'), I can help explain what they usually mean.";

    res.json({ explanation });
  } catch (err) {
    console.error("report-explain error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3B) REPORT EXPLANATION FROM FILE (NO TEXT INPUT)
   POST /api/ai/report-explain-file
   Takes a FILE upload instead of text.
============================================================ */
router.post(
  "/report-explain-file",
  requireAuth,
  upload.single("file"), // field name must be "file"
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Report file is required" });
      }

      // TODO: Later → OCR / parse file + send extracted text to OpenAI

      const explanation = `
I received your report file: "${req.file.originalname}".

In the future, I will:
- Read the contents of this report,
- Highlight important values,
- And explain them in simple language.

Right now, please confirm all interpretations with your doctor.
      `.trim();

      return res.json({
        explanation,
        safeNotice:
          "This is general AI guidance, not a medical diagnosis. Always consult your doctor for report interpretation.",
      });
    } catch (err) {
      console.error("report-explain-file error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================
   4) DOCTOR TYPE SUGGESTION
   POST /api/ai/doctor-suggest
   Suggests a type of doctor (specialty), NOT a specific doctor.
============================================================ */
router.post("/doctor-suggest", requireAuth, async (req, res) => {
  try {
    const { mainIssue, city } = req.body || {};
    const issue = (mainIssue || "").toLowerCase();

    let specialty = "General physician";
    if (
      issue.includes("period") ||
      issue.includes("pcos") ||
      issue.includes("pelvic")
    ) {
      specialty = "Gynecologist";
    } else if (issue.includes("thyroid") || issue.includes("hormone")) {
      specialty = "Endocrinologist";
    } else if (issue.includes("skin") || issue.includes("acne")) {
      specialty = "Dermatologist";
    } else if (
      issue.includes("anxiety") ||
      issue.includes("depression") ||
      issue.includes("panic") ||
      issue.includes("mental")
    ) {
      specialty = "Psychiatrist / Psychologist";
    }

    const locationTip = city
      ? `You can search online for “${specialty} near ${city}” on Google or a trusted hospital website.`
      : `You can search online for “${specialty} near me” on Google or a trusted hospital website.`;

    res.json({
      specialty,
      message:
        `Based on what you wrote, a ${specialty} might be appropriate. ` +
        `This is not a diagnosis. Please visit a licensed doctor for proper evaluation.\n\n${locationTip}`,
    });
  } catch (err) {
    console.error("doctor-suggest error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   5) COMFORT / REMEDY SUGGESTIONS
   POST /api/ai/remedy-suggest
   Gentle comfort tips with a clear warning (not treatment).
============================================================ */
router.post("/remedy-suggest", requireAuth, async (req, res) => {
  try {
    const { symptom, cyclePhase } = req.body || {};
    const s = (symptom || "").toLowerCase();
    const phase = (cyclePhase || "period").toLowerCase();

    const baseWarning =
      "These are general comfort tips, not medical treatment. If pain is severe, bleeding is heavy, or you feel very unwell, please see a doctor urgently.";

    let tips = [
      "Rest when you feel tired.",
      "Drink water regularly.",
      "Track your symptoms to share with your doctor.",
    ];

    if (s.includes("cramp") || s.includes("pain")) {
      tips = [
        "Use a warm water bag on your lower abdomen if it is safe for you.",
        "Gentle stretching or slow walking can sometimes ease cramps.",
        "Try to eat light, balanced meals instead of skipping food.",
      ];
    } else if (s.includes("bloat")) {
      tips = [
        "Limit very salty or processed foods and fizzy drinks.",
        "Sip warm water or light herbal tea.",
        "Wear loose, comfortable clothing around your stomach.",
      ];
    } else if (
      s.includes("mood") ||
      s.includes("anxiety") ||
      s.includes("low")
    ) {
      tips = [
        "Try 5–10 minutes of deep breathing or grounding exercises.",
        "Write your feelings in a journal without judging yourself.",
        "Reach out to a trusted person or helpline if you feel overwhelmed.",
      ];
    }

    res.json({
      tips,
      phase,
      warning: baseWarning,
    });
  } catch (err) {
    console.error("remedy-suggest error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
