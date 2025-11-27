// frontend/src/components/GameSuggestions.jsx
import React from "react";

const games = [
  {
    title: "Spirit City: Lofi Sessions",
    vibe: "Focus • Cozy • Productivity",
    platforms: "PC (Steam)",
    description:
      "A cozy focus app + game where you sit in a calm room, listen to lofi, track tasks, and gently stay on top of your day.",
    link: "https://store.steampowered.com",
  },
  {
    title: "Kind Words (lo fi chill beats to write to)",
    vibe: "Journaling • Support • Letters",
    platforms: "PC, Mac, Linux (Steam)",
    description:
      "You write and receive kind anonymous letters while listening to soft lofi music – perfect for bad days and gentle connection.",
    link: "https://store.steampowered.com",
  },
  {
    title: "Alba: A Wildlife Adventure",
    vibe: "Exploration • Nature • Calm",
    platforms: "PC, Console, Mobile",
    description:
      "Play as a young girl exploring an island, helping animals and people. Soft visuals, no pressure, just slow and peaceful tasks.",
    link: "https://www.albagame.com",
  },
  {
    title: "Cats & Soup",
    vibe: "Cute • Idle • Zero Stress",
    platforms: "Mobile (iOS / Android)",
    description:
      "Adorable cats make soup while you collect, decorate and relax. Great when you’re tired and only want something low-effort.",
    link: "https://play.google.com",
  },
];

function GameSuggestions() {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>
        Gentle Game Suggestions 🎮
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
        These are cozy, low-stress games that can help you unwind, feel safe,
        and gently distract your mind.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {games.map((game) => (
          <div
            key={game.title}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 4 }}>{game.title}</h3>
            <p
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              {game.vibe}
            </p>
            <p
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: 13,
                color: "#4b5563",
              }}
            >
              {game.description}
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Platforms: {game.platforms}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameSuggestions;
