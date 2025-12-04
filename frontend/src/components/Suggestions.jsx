// frontend/src/components/Suggestions.jsx
import React, { useState } from "react";
import BookSuggestions from "./BookSuggestions";
import GameSuggestions from "./GameSuggestions";

const API_BASE = "http://localhost:4000/api";

const MOODS = [
  {
    id: "sad",
    label: "Sad / low",
    emoji: "😔",
    desc: "Feeling heavy, low, like crying or empty.",
  },
  {
    id: "anxious",
    label: "Anxious / worried",
    emoji: "😰",
    desc: "Overthinking, nervous, heart racing.",
  },
  {
    id: "angry",
    label: "Angry / frustrated",
    emoji: "😡",
    desc: "Annoyed, irritated, fed up.",
  },
  {
    id: "lonely",
    label: "Lonely",
    emoji: "🥺",
    desc: "Feeling alone or unseen by others.",
  },
  {
    id: "tired",
    label: "Tired / drained",
    emoji: "🥱",
    desc: "Exhausted mentally or physically.",
  },
  {
    id: "neutral",
    label: "Neutral / okay",
    emoji: "🙂",
    desc: "Not bad, not great, just okay.",
  },
  {
    id: "calm",
    label: "Calm / content",
    emoji: "🌿",
    desc: "Feeling peaceful or stable.",
  },
];

// map UI mood → backend mood string
const MOOD_TO_BACKEND = {
  sad: "sad",
  anxious: "anxious",
  angry: "angry",
  lonely: "sad",
  tired: "neutral",
  neutral: "neutral",
  calm: "calm",
};

export default function Suggestions() {
  const [selectedMood, setSelectedMood] = useState(null); // MOODS id
  const [moodResult, setMoodResult] = useState(null); // backend result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMoodClick(moodId) {
    setSelectedMood(moodId);
    setMoodResult(null);
    setError("");

    const backendMood = MOOD_TO_BACKEND[moodId] || "neutral";
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You need to be logged in to get mood suggestions.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/mood-suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mood: backendMood,
          // cyclePhase: you can plug in user's current phase later from Period Logger
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }
      setMoodResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const selectedMoodObj = MOODS.find((m) => m.id === selectedMood);

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 6,
          color: "#6b21a8",
          fontWeight: 600,
        }}
      >
        💡 Suggestions Center
      </h2>
      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 16,
        }}
      >
        Let’s start with your mood. I’ll suggest self-care actions, books, and
        gentle activities based on how you feel right now. 🌸
      </p>

      {/* 1) MOOD PICKER */}
      <div
        style={{
          borderRadius: 18,
          padding: 16,
          background: "#f5f3ff",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          marginBottom: 18,
        }}
      >
        <h3 style={{ marginBottom: 8, color: "#4c1d95" }}>
          1️⃣ How are you feeling right now?
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
          Tap the option that feels closest. It doesn’t have to be perfect — we
          just want a general sense of your mood.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMoodClick(m.id)}
              style={{
                padding: 10,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background:
                  selectedMood === m.id ? "#c4b5fd" : "rgba(196,181,253,0.45)",
                color: "#111827",
                boxShadow:
                  selectedMood === m.id
                    ? "0 0 0 2px #4c1d95"
                    : "0 2px 6px rgba(0,0,0,0.06)",
                transition: "0.2s",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.emoji}</div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ fontSize: 13, color: "#4b5563", marginTop: 10 }}>
            Thinking of gentle ideas for you… 💭
          </p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: "#b91c1c", marginTop: 10 }}>
            {error}
          </p>
        )}
      </div>

      {/* If no mood selected yet */}
      {!selectedMood && (
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Choose a mood above to see mood-based self-care, book and activity
          suggestions.
        </p>
      )}

      {selectedMood && (
        <>
          {/* 2) MOOD SELF-CARE (from backend) */}
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background: "#eef2ff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              marginBottom: 18,
            }}
          >
            <h3 style={{ marginBottom: 6, color: "#4338ca" }}>
              2️⃣ Gentle Mood Suggestions for{" "}
              {selectedMoodObj ? selectedMoodObj.label : "you"}
            </h3>
            <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 8 }}>
              These are small, realistic ideas — not pressure to “fix” yourself.
              Take what feels helpful and ignore the rest. 💜
            </p>

            {moodResult ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    background: "white",
                    padding: 10,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <h4 style={{ marginBottom: 6, color: "#4338ca" }}>
                    🌱 Simple actions for today
                  </h4>
                  <ul
                    style={{
                      paddingLeft: 18,
                      margin: 0,
                      fontSize: 13,
                      color: "#111827",
                    }}
                  >
                    {moodResult.actions?.map((a, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    borderRadius: 14,
                    background: "white",
                    padding: 10,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <h4 style={{ marginBottom: 6, color: "#4338ca" }}>
                    🥗 Supportive food ideas
                  </h4>
                  <ul
                    style={{
                      paddingLeft: 18,
                      margin: 0,
                      fontSize: 13,
                      color: "#111827",
                    }}
                  >
                    {moodResult.foods?.map((f, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginTop: 6,
                }}
              >
                I’ll fill this section with gentle actions and food ideas as
                soon as you pick a mood.
              </p>
            )}

            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 8,
              }}
            >
              This is general wellness support, not medical treatment. If your
              pain (emotional or physical) feels overwhelming, please consider
              talking to a trusted doctor or counselor.
            </p>
          </div>

          {/* 3) BOOKS FOR THIS MOOD */}
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background: "#eff6ff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              marginBottom: 18,
            }}
          >
            <BookSuggestions mood={selectedMood} />
          </div>

          {/* 4) GAMES / ACTIVITIES FOR THIS MOOD */}
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background: "#ecfdf5",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              marginBottom: 10,
            }}
          >
            <GameSuggestions mood={selectedMood} />
          </div>
        </>
      )}
    </div>
  );
}
