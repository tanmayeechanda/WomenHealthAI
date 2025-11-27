// backend/routes/resources.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth"); // your JWT middleware

// Later you can move these to MongoDB if you want.
// For now: clean static curated lists from backend.

const gameSuggestions = [
  {
    id: "spirit-city",
    title: "Spirit City: Lofi Sessions",
    vibe: "Focus • Cozy • Productivity",
    platforms: "PC (Steam)",
    description:
      "A cozy focus app + game where you sit in a calm room, listen to lofi, and gently stay on top of your day.",
    url: "https://store.steampowered.com/app/2284410/Spirit_City_Lofi_Sessions/",
  },
  {
    id: "kind-words",
    title: "Kind Words (lo fi chill beats to write to)",
    vibe: "Journaling • Support • Letters",
    platforms: "PC, Mac, Linux (Steam)",
    description:
      "Write and receive kind anonymous letters while listening to chill lofi — perfect for rough days.",
    url: "https://store.steampowered.com/app/1070710/Kind_Words_lo_fi_chill_beats_to_write_to/",
  },
  {
    id: "alba",
    title: "Alba: A Wildlife Adventure",
    vibe: "Exploration • Nature • Calm",
    platforms: "PC, Console, Mobile",
    description:
      "Play as a young girl exploring an island, helping animals and people in a calm, pressure-free environment.",
    url: "https://www.alba-game.com/",
  },
  {
    id: "cats-and-soup",
    title: "Cats & Soup",
    vibe: "Cute • Idle • Zero Stress",
    platforms: "Mobile (iOS / Android)",
    description:
      "Adorable cats making soup while you decorate and relax. Great for low-energy days.",
    url: "https://play.google.com/store/apps/details?id=com.hidea.cat",
  },
];

const bookSuggestions = [
  {
    id: "set-boundaries-find-peace",
    title: "Set Boundaries, Find Peace",
    author: "Nedra Glover Tawwab",
    theme: "Boundaries • Emotional Health",
    description:
      "Practical guidance on saying no, protecting your energy, and building healthier relationships.",
    url: "https://www.goodreads.com/book/show/55638184-set-boundaries-find-peace",
  },
  {
    id: "body-keeps-the-score",
    title: "The Body Keeps the Score",
    author: "Bessel van der Kolk",
    theme: "Trauma • Mind–Body Connection",
    description:
      "How stress and trauma live in the body and science-backed paths toward healing.",
    url: "https://www.goodreads.com/book/show/18693771-the-body-keeps-the-score",
  },
  {
    id: "31-days-self-compassion",
    title: "31 Days of Self-Compassion",
    author: "Blair Nicole",
    theme: "Self-kindness • Daily Practice",
    description:
      "Short daily reflections and prompts to practice being kinder to yourself.",
    url: "https://www.goodreads.com/book/show/61339389-31-days-of-self-compassion",
  },
  {
    id: "let-them-theory",
    title: "The Let Them Theory",
    author: "Mel Robbins",
    theme: "Letting Go • Mental Peace",
    description:
      "Focuses on releasing control over others and choosing yourself for more mental peace.",
    url: "https://www.goodreads.com/book/show/218818528-the-let-them-theory",
  },
];

// Require auth so only logged-in users see these
router.get("/games", requireAuth, (req, res) => {
  res.json(gameSuggestions);
});

router.get("/books", requireAuth, (req, res) => {
  res.json(bookSuggestions);
});

module.exports = router;
