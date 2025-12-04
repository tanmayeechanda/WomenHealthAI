// frontend/src/components/MoodSuggest.jsx
import React, { useState } from "react";

const API_BASE = "http://localhost:4000/api";

const MOOD_OPTIONS = [
  { id: "anxious", label: "Anxious / worried", emoji: "😰" },
  { id: "sad", label: "Sad / low", emoji: "😔" },
  { id: "angry", label: "Angry / frustrated", emoji: "😡" },
  { id: "calm", label: "Calm / content", emoji: "🌿" },
  { id: "neutral", label: "Neutral / okay", emoji: "🙂" },
];

export default function MoodSuggest({ defaultCyclePhase = "period" }) {
  const [mood, setMood] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ask() {
    if (!mood) return;
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You need to be logged in to get mood suggestions.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/ai/mood-suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood, cyclePhase: defaultCyclePhase }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error fetching suggestions");
      }
      setResult(data);
    } catch (err) {
      console.error("MoodSuggest error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        background: "#f5f3ff",
      }}
    >
      <h4
        style={{
          margin: 0,
          marginBottom: 6,
          color: "#4c1d95",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        🧠 Quick Mood Suggestions
      </h4>
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 8,
        }}
      >
        Tap a mood and I’ll suggest small actions and food ideas that might
        support you right now.
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: mood === m.id ? "#4f46e5" : "white",
              color: mood === m.id ? "white" : "#111827",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              fontSize: 13,
            }}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={ask}
        disabled={!mood || loading}
        style={{
          padding: "6px 12px",
          borderRadius: 999,
          border: "none",
          background: !mood || loading ? "#9ca3af" : "#6366f1",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: !mood || loading ? "default" : "pointer",
        }}
      >
        {loading ? "Getting suggestions..." : "Get suggestions"}
      </button>

      {error && (
        <p
          style={{
            fontSize: 12,
            color: "#b91c1c",
            marginTop: 6,
          }}
        >
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 10 }}>
          <h5
            style={{
              fontSize: 13,
              margin: 0,
              marginBottom: 4,
              color: "#4338ca",
            }}
          >
            🌱 Gentle actions
          </h5>
          <ul
            style={{
              paddingLeft: 18,
              marginTop: 0,
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            {(result.actions || []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>

          <h5
            style={{
              fontSize: 13,
              margin: 0,
              marginBottom: 4,
              color: "#4338ca",
            }}
          >
            🥗 Food tips
          </h5>
          <ul
            style={{
              paddingLeft: 18,
              marginTop: 0,
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            {(result.foods || []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <p
            style={{
              fontSize: 11,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            {result.checkin ||
              "If your pain (emotional or physical) feels overwhelming, please consider talking to a trusted doctor or counselor."}
          </p>
        </div>
      )}
    </div>
  );
}
