// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

// If you later use OpenAI, import it here:
// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Simple safe empathetic fallback (no AI needed)
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
        "Grounding method: Name 5 things you see, 4 things you can touch.",
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

module.exports = router;
