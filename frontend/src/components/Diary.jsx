// frontend/src/components/Diary.jsx
import React, { useState, useEffect } from "react";
const API_BASE = "http://localhost:4000/api";

export default function Diary() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);

  async function fetchEntries() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/diary/entries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("Diary fetch error");
      return;
    }
    const data = await res.json();
    setEntries(data);
  }
  useEffect(() => {
    fetchEntries();
  }, []);

  async function save() {
    const token = localStorage.getItem("token");
    if (!text.trim()) return alert("Write something first");
    const res = await fetch(`${API_BASE}/diary/entry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        date: new Date().toISOString(),
        mood: "neutral",
        private: true,
      }),
    });
    if (res.ok) {
      setText("");
      fetchEntries();
    } else {
      const err = await res.json();
      alert(err.error || "Error saving diary");
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Your diary</h4>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
        placeholder="Write how you feel today..."
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={save} style={{ padding: "8px 12px" }}>
          Save entry
        </button>
        <button
          onClick={() => {
            setText("");
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {entries.map((e) => (
          <div
            key={e._id}
            style={{
              padding: 8,
              border: "1px solid #eee",
              marginBottom: 8,
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "#666" }}>
              {new Date(e.date).toLocaleString()}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
