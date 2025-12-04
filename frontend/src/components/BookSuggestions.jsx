// frontend/src/components/BookSuggestions.jsx
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

// mood prop is optional:
// - if mood passed → fixed mood, no internal filter buttons
// - if no mood → user can pick mood inside this component
function BookSuggestions({ mood }) {
  const [selectedMood, setSelectedMood] = useState(mood || "all");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // used to trigger re-fetch

  useEffect(() => {
    if (mood) {
      setSelectedMood(mood);
    }
  }, [mood]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view book suggestions.");
      setBooks([]);
      return;
    }

    setLoading(true);
    setError("");
    setBooks([]);

    const queryMood =
      selectedMood && selectedMood !== "all" ? `?mood=${selectedMood}` : "";

    fetch(`http://localhost:4000/api/resources/books${queryMood}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch books.");
        }
        return res.json();
      })
      .then((data) => {
        setBooks(data || []);
      })
      .catch((err) => {
        console.error("Books fetch error:", err);
        setError(err.message || "Could not load book suggestions right now.");
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
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Book Suggestions 📚</h2>
      <p style={{ color: "#6b7280", marginBottom: 10, fontSize: 14 }}>
        These are online book links or info pages. You can open them in a new
        tab and choose the format you like (ebook, paperback, etc.).
      </p>

      {/* Show internal mood filter only if parent didn't fix mood */}
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
                setRefreshKey(0); // reset refresh when changing mood
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                background:
                  selectedMood === m.id ? "#bfdbfe" : "rgba(191,219,254,0.6)",
                fontWeight: selectedMood === m.id ? 600 : 500,
                color: "#111827",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p>Loading book suggestions…</p>}
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

      {!loading && !error && books.length === 0 && (
        <p style={{ fontSize: 13, color: "#4b5563" }}>
          No book suggestions available right now. Try a different mood, or come
          back later.
        </p>
      )}

      {!loading && !error && books.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() =>
                  window.open(book.url, "_blank", "noopener,noreferrer")
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
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.05)";
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
                  {book.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  by {book.author}
                </p>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#4b5563",
                  }}
                >
                  {book.description}
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
              background: "#6366f1",
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
        Always choose what feels emotionally safe for you. If a book feels too
        heavy, it’s okay to stop reading. 💜
      </p>
    </div>
  );
}

export default BookSuggestions;
