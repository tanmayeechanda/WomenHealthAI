// frontend/src/components/GameSuggestions.jsx
import React, { useEffect, useState } from "react";

const MOOD_FILTERS = [
  { id: "all", label: "All moods" },
  { id: "sad", label: "Sad / low" },
  { id: "anxious", label: "Anxious / worried" },
  { id: "angry", label: "Angry / frustrated" },
  { id: "lonely", label: "Lonely" },
  { id: "tired", label: "Tired / drained" },
  { id: "neutral", label: "Neutral / okay" },
  { id: "calm", label: "Calm / content" },
];

// mood prop optional, same behavior as books
function GameSuggestions({ mood }) {
  const [selectedMood, setSelectedMood] = useState(mood || "all");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (mood) {
      setSelectedMood(mood);
    }
  }, [mood]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view game suggestions.");
      setGames([]);
      return;
    }

    setLoading(true);
    setError("");
    setGames([]);

    const queryMood =
      selectedMood && selectedMood !== "all" ? `?mood=${selectedMood}` : "";

    fetch(`http://localhost:4000/api/resources/games${queryMood}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch games.");
        }
        return res.json();
      })
      .then((data) => {
        setGames(data || []);
      })
      .catch((err) => {
        console.error("Games fetch error:", err);
        setError(err.message || "Could not load game suggestions right now.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedMood, refreshKey]);

  function handleAnotherSet() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>
        Gentle Game & Activity Suggestions 🎮
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 10, fontSize: 14 }}>
        Some are real online games or apps, some are calm offline activities.
        Pick what matches your energy level.
      </p>

      {!mood && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {MOOD_FILTERS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMood(m.id);
                setRefreshKey(0);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                background:
                  selectedMood === m.id ? "#bbf7d0" : "rgba(187,247,208,0.75)",
                fontWeight: selectedMood === m.id ? 600 : 500,
                color: "#14532d",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p>Loading game suggestions…</p>}
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

      {!loading && !error && games.length === 0 && (
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          No game suggestions available right now. Try a different mood, or come
          back later.
        </p>
      )}

      {!loading && !error && games.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            }}
          >
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() =>
                  window.open(game.url, "_blank", "noopener,noreferrer")
                }
                style={{
                  borderRadius: 12,
                  border: "1px solid #d1fae5",
                  padding: 12,
                  backgroundColor: "#ecfdf5",
                  cursor: "pointer",
                  transition: "transform 0.1s ease, box-shadow 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {game.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#15803d",
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

          <button
            onClick={handleAnotherSet}
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "6px 12px",
              borderRadius: 999,
              border: "none",
              background: "#22c55e",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Show another set ✨
          </button>
        </>
      )}

      <p
        style={{
          fontSize: 11,
          color: "#6b7280",
          marginTop: 10,
        }}
      >
        If anything feels overwhelming or overstimulating, it’s okay to stop and
        rest. This is meant to be gentle, not stressful. 💚
      </p>
    </div>
  );
}

export default GameSuggestions;
