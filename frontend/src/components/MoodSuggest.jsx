// frontend/src/components/MoodSuggest.jsx
import React, { useState } from "react";
const API_BASE = "http://localhost:4000/api";

export default function MoodSuggest() {
  const [mood, setMood] = useState("");
  const [result, setResult] = useState(null);

  async function ask() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/ai/mood-suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mood, cyclePhase: "period" }),
    });
    const data = await res.json();
    if (res.ok) setResult(data);
    else alert(data.error || "Error fetching suggestions");
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Mood-based suggestions</h4>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}
      >
        {["anxious", "sad", "angry", "calm", "neutral"].map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            style={{
              padding: 8,
              background: mood === m ? "#2563eb" : "white",
              color: mood === m ? "white" : "black",
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <button onClick={ask} disabled={!mood} style={{ padding: "8px 12px" }}>
        Get suggestions
      </button>

      {result && (
        <div style={{ marginTop: 8 }}>
          <h5>Actions</h5>
          <ul>
            {(result.actions || []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <h5>Food tips</h5>
          <ul>
            {(result.foods || []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: "#777" }}>{result.checkin}</p>
        </div>
      )}
    </div>
  );
}
