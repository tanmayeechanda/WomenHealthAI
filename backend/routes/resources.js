// backend/routes/resources.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

/**
 * Simple helper to shuffle array & take first N
 */
function pickRandom(list, count) {
  const copy = [...list];
  copy.sort(() => Math.random() - 0.5);
  return copy.slice(0, count);
}

/* ---------------------- BOOKS DATA ---------------------- */
/**
 * Each book has:
 * - id
 * - title
 * - author
 * - moods: array of mood ids: sad, anxious, angry, lonely, tired, neutral, calm
 * - description
 * - url: external page (ebook / info)
 */
const BOOKS = [
  {
    id: 1,
    title: "The Comfort Book",
    author: "Matt Haig",
    moods: ["sad", "lonely", "tired"],
    description:
      "Gentle, short reflections for days when everything feels heavy.",
    url: "https://www.google.com/search?q=the+comfort+book+matt+haig",
  },
  {
    id: 2,
    title: "Milk and Honey",
    author: "Rupi Kaur",
    moods: ["sad", "lonely", "angry"],
    description:
      "Poetry about pain, heartbreak, womanhood, and healing in small pieces.",
    url: "https://www.google.com/search?q=milk+and+honey+rupi+kaur+ebook",
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    moods: ["neutral", "tired"],
    description:
      "Tiny, realistic habit changes for when you want to slowly rebuild.",
    url: "https://www.google.com/search?q=atomic+habits+ebook",
  },
  {
    id: 4,
    title: "Ikigai",
    author: "Héctor García & Francesc Miralles",
    moods: ["anxious", "neutral", "calm"],
    description:
      "Soft reflections on purpose, longevity, and a calmer way of living.",
    url: "https://www.google.com/search?q=ikigai+book+online",
  },
  {
    id: 5,
    title: "Big Magic",
    author: "Elizabeth Gilbert",
    moods: ["tired", "sad", "neutral"],
    description:
      "For reconnecting with creativity when you feel stuck or afraid.",
    url: "https://www.google.com/search?q=big+magic+ebook",
  },
  {
    id: 6,
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    moods: ["angry", "frustrated", "neutral"],
    description:
      "A blunt, honest perspective for when you’re fed up with everything.",
    url: "https://www.google.com/search?q=subtle+art+of+not+giving+a+f+book",
  },
  {
    id: 7,
    title: "The Mountain Is You",
    author: "Brianna Wiest",
    moods: ["sad", "anxious", "lonely"],
    description:
      "On self-sabotage, healing, and turning emotional pain into growth.",
    url: "https://www.google.com/search?q=the+mountain+is+you+ebook",
  },
];

/* ---------------------- GAMES DATA ---------------------- */
/**
 * These are gentle, low-pressure ideas + some simple online games/apps
 * - id
 * - title
 * - moods
 * - vibe
 * - description
 * - platforms
 * - url: game page / calm activity link / play link
 */
const GAMES = [
  {
    id: 1,
    title: "Soft Self-Care Evening 🌙",
    moods: ["sad", "tired", "lonely"],
    vibe: "Cozy, very low energy, offline",
    description:
      "A simple routine: warm drink, soft music, journaling a few lines, and gentle lights.",
    platforms: "Offline, at home",
    url: "https://www.youtube.com/results?search_query=lofi+relaxing+playlist",
  },
  {
    id: 2,
    title: "5–4–3–2–1 Grounding Game 🧠",
    moods: ["anxious", "sad"],
    vibe: "Grounding, for racing thoughts",
    description:
      "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you’re grateful for.",
    platforms: "Offline, anywhere",
    url: "https://www.google.com/search?q=5+4+3+2+1+grounding+technique",
  },
  {
    id: 3,
    title: "Calm Coloring / Mandala Apps 🎨",
    moods: ["anxious", "tired", "neutral"],
    vibe: "Relaxing, visual, quiet",
    description:
      "Digital coloring apps where you fill patterns or mandalas with color.",
    platforms: "Android, iOS (Colorfy, Happy Color, etc.)",
    url: "https://play.google.com/store/search?q=coloring%20book%20for%20adults&c=apps",
  },
  {
    id: 4,
    title: "Stardew Valley (Farming Sim) 🌾",
    moods: ["sad", "tired", "lonely"],
    vibe: "Wholesome, slow, comforting",
    description:
      "Chill farming game where you plant crops, talk to villagers, and go at your own pace.",
    platforms: "PC, Switch, PS, Xbox, Mobile",
    url: "https://www.stardewvalley.net/",
  },
  {
    id: 5,
    title: "Meditation & Breathing Apps 🌬️",
    moods: ["anxious", "angry"],
    vibe: "Calming, short guided sessions",
    description:
      "Use free meditations or breathing timers to slow down your nervous system.",
    platforms: "Android, iOS (Insight Timer, Medito, etc.)",
    url: "https://play.google.com/store/search?q=meditation&c=apps",
  },
  {
    id: 6,
    title: "Tiny Joy Hunt 🌈",
    moods: ["neutral", "calm"],
    vibe: "Soft, perspective-shifting activity",
    description:
      "Look for 3 small things around you that make your life easier or happier and say thank you.",
    platforms: "Offline, anywhere",
    url: "https://www.google.com/search?q=gratitude+practice+ideas",
  },
  {
    id: 7,
    title: "Casual Mobile Puzzles 🧩",
    moods: ["neutral", "tired"],
    vibe: "Light brain engagement without pressure",
    description:
      "Simple puzzles like 2048, match-3, nonogram, or sudoku at your own pace.",
    platforms: "Android, iOS",
    url: "https://play.google.com/store/search?q=puzzle%20games&c=apps",
  },
];

/* -------------------- BOOKS ENDPOINT -------------------- */
// GET /api/resources/books?mood=sad
router.get("/books", requireAuth, (req, res) => {
  try {
    const { mood } = req.query;
    let filtered = BOOKS;

    if (mood && typeof mood === "string") {
      const m = mood.toLowerCase();
      filtered = BOOKS.filter((b) => b.moods.includes(m));
    }

    const result = pickRandom(filtered, 4); // return up to 4 random books
    res.json(result);
  } catch (err) {
    console.error("Books resource error:", err);
    res.status(500).json({ error: "Failed to load book suggestions" });
  }
});

/* -------------------- GAMES ENDPOINT -------------------- */
// GET /api/resources/games?mood=sad
router.get("/games", requireAuth, (req, res) => {
  try {
    const { mood } = req.query;
    let filtered = GAMES;

    if (mood && typeof mood === "string") {
      const m = mood.toLowerCase();
      filtered = GAMES.filter((g) => g.moods.includes(m));
    }

    const result = pickRandom(filtered, 4); // return up to 4 random games
    res.json(result);
  } catch (err) {
    console.error("Games resource error:", err);
    res.status(500).json({ error: "Failed to load game suggestions" });
  }
});

module.exports = router;
