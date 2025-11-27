// frontend/src/components/GameSuggestions.jsx
import React, { useEffect, useState } from "react";

function GameSuggestions({ token }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("GameSuggestions: token =", token);

    if (!token) {
      setError("You must be logged in to view game suggestions.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:4000/api/resources/games", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("Games response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.log("Games error body:", text);
          throw new Error(text || "Failed to fetch games.");
        }

        return res.json();
      })
      .then((data) => {
        console.log("Games data:", data);
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Games fetch error:", err);
        setError(err.message || "Could not load game suggestions right now.");
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p>Loading game suggestions…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>
        Gentle Game Suggestions 🎮
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
        Tap a card to open the game page in a new tab.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() =>
              window.open(game.url, "_blank", "noopener,noreferrer")
            }
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              backgroundColor: "#f9fafb",
              cursor: "pointer",
              transition: "transform 0.1s ease, box-shadow 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
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
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: 12,
                color: "#ec4899",
              }}
            >
              Click to open ↗
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameSuggestions;
