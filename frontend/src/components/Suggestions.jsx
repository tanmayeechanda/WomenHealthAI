// frontend/src/components/Suggestions.jsx
import React, { useState } from "react";
import MoodSuggest from "./MoodSuggest";
import BookSuggest from "./BookSuggest";
import GameSuggest from "./GameSuggest";

export default function Suggestions() {
  const [open, setOpen] = useState(true); // collapse/expand
  const [type, setType] = useState("mood"); // 'mood' | 'book' | 'game'

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Suggestions</h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "#2563eb",
          }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          {/* Tabs for Mood / Book / Game */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setType("mood")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: type === "mood" ? "#2563eb" : "white",
                color: type === "mood" ? "white" : "#111827",
                cursor: "pointer",
              }}
            >
              Mood
            </button>
            <button
              type="button"
              onClick={() => setType("book")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: type === "book" ? "#2563eb" : "white",
                color: type === "book" ? "white" : "#111827",
                cursor: "pointer",
              }}
            >
              Book
            </button>
            <button
              type="button"
              onClick={() => setType("game")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: type === "game" ? "#2563eb" : "white",
                color: type === "game" ? "white" : "#111827",
                cursor: "pointer",
              }}
            >
              Game
            </button>
          </div>

          {/* Content area – show one suggestion type at a time */}
          <div
            style={{
              borderRadius: 12,
              background: "white",
              padding: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            {type === "mood" && <MoodSuggest />}
            {type === "book" && <BookSuggest />}
            {type === "game" && <GameSuggest />}
          </div>
        </>
      )}
    </div>
  );
}
