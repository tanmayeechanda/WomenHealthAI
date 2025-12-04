// frontend/src/components/Diary.jsx
import React, { useState, useEffect, useMemo } from "react";
const API_BASE = "http://localhost:4000/api";
const SERVER_BASE = API_BASE.replace("/api", ""); // http://localhost:4000

const MOODS = [
  { key: "happy", label: "Happy", emoji: "😊" },
  { key: "neutral", label: "Neutral", emoji: "😐" },
  { key: "sad", label: "Sad", emoji: "😔" },
  { key: "anxious", label: "Anxious", emoji: "😰" },
  { key: "angry", label: "Angry", emoji: "😡" },
  { key: "tired", label: "Tired", emoji: "😴" },
];

const CATEGORIES = [
  "Daily Reflection",
  "Stress & Anxiety",
  "Health & Body",
  "Relationships",
  "Career / Studies",
  "Period Day",
  "Gratitude",
];

const CYCLE_PHASES = [
  "Not sure",
  "Menstrual",
  "Follicular",
  "Ovulation",
  "Luteal",
];

export default function Diary() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mood, setMood] = useState("neutral");
  const [category, setCategory] = useState("Daily Reflection");
  const [cyclePhase, setCyclePhase] = useState("Not sure");
  const [isPrivate, setIsPrivate] = useState(true);
  const [photos, setPhotos] = useState([]); // File[]

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const token = localStorage.getItem("token");

  async function fetchEntries() {
    try {
      const res = await fetch(`${API_BASE}/diary/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Diary fetch error");
        return;
      }
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Diary fetch error", err);
    }
  }

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setTitle("");
    setText("");
    setMood("neutral");
    setCategory("Daily Reflection");
    setCyclePhase("Not sure");
    setIsPrivate(true);
    setEditingId(null);
    setPhotos([]);
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
  }

  async function save() {
    if (!text.trim()) return alert("Write something first");
    setLoading(true);

    try {
      if (editingId) {
        // EDIT: text fields only, photos remain as they were
        const body = {
          text,
          title,
          date: new Date().toISOString(),
          mood,
          category,
          cyclePhase,
          private: isPrivate,
        };

        const res = await fetch(`${API_BASE}/diary/entry/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          resetForm();
          fetchEntries();
        } else {
          const err = await res.json();
          alert(err.error || "Error updating diary");
        }
      } else {
        // CREATE: use FormData so we can send photos
        const formData = new FormData();
        formData.append("text", text);
        formData.append("title", title);
        formData.append("date", new Date().toISOString());
        formData.append("mood", mood);
        formData.append("category", category);
        formData.append("cyclePhase", cyclePhase);
        formData.append("private", isPrivate);

        photos.forEach((file) => {
          formData.append("photos", file);
        });

        const res = await fetch(`${API_BASE}/diary/entry`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type, browser sets multipart boundary
          },
          body: formData,
        });

        if (res.ok) {
          resetForm();
          fetchEntries();
        } else {
          const err = await res.json();
          alert(err.error || "Error saving diary");
        }
      }
    } catch (err) {
      console.error("Diary save error", err);
      alert("Error saving diary");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const sure = window.confirm("Delete this entry? This cannot be undone.");
    if (!sure) return;

    try {
      const res = await fetch(`${API_BASE}/diary/entry/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Error deleting entry");
      }
    } catch (err) {
      console.error("Diary delete error", err);
      alert("Error deleting entry");
    }
  }

  function handleEdit(entry) {
    setEditingId(entry._id);
    setTitle(entry.title || "");
    setText(entry.text || "");
    setMood(entry.mood || "neutral");
    setCategory(entry.category || "Daily Reflection");
    setCyclePhase(entry.cyclePhase || "Not sure");
    setIsPrivate(entry.private ?? true);
    setPhotos([]); // editing doesn't change existing photos for now
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesMood = filterMood ? e.mood === filterMood : true;
      const matchesCategory = filterCategory
        ? e.category === filterCategory
        : true;
      const matchesSearch = search
        ? (e.title && e.title.toLowerCase().includes(search.toLowerCase())) ||
          (e.text && e.text.toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchesMood && matchesCategory && matchesSearch;
    });
  }, [entries, filterMood, filterCategory, search]);

  return (
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 12,
          padding: 12,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(255,192,203,0.15), rgba(173,216,230,0.15))",
        }}
      >
        <h3 style={{ margin: 0 }}>Your personal diary</h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
          This is your safe place. You can also save special pictures from your
          day here 💗
        </p>
      </div>

      {/* New / Edit Entry */}
      <div
        style={{
          border: "1px solid #eee",
          padding: 12,
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
        }}
      >
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title for today (optional)…"
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />

        {/* Mood selector */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13 }}>Today I feel:</span>
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(m.key)}
              style={{
                borderRadius: 16,
                padding: "4px 10px",
                border: mood === m.key ? "1px solid #e91e63" : "1px solid #ddd",
                background: mood === m.key ? "#fde4ee" : "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* Category + Phase + Private */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={cyclePhase}
            onChange={(e) => setCyclePhase(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
            }}
          >
            {CYCLE_PHASES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            🔒 Extra private
          </label>
        </div>

        {/* File upload */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, color: "#555" }}>
            Special picture(s) of today:
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            style={{ display: "block", marginTop: 4, fontSize: 13 }}
          />
          {photos.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {photos.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 70,
                    height: 70,
                    overflow: "hidden",
                    borderRadius: 8,
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ddd",
            resize: "vertical",
          }}
          placeholder="Write about your day, your body, your thoughts, and what these pictures mean to you…"
        />

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#777" }}>
            {text.length} characters
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel edit
              </button>
            )}
            <button
              onClick={() => {
                setText("");
                setPhotos([]);
              }}
              type="button"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Clear
            </button>
            <button
              onClick={save}
              type="button"
              disabled={loading || !text.trim()}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#e91e63",
                color: "#fff",
                cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                opacity: loading || !text.trim() ? 0.6 : 1,
                fontSize: 13,
              }}
            >
              {editingId
                ? loading
                  ? "Updating…"
                  : "Update entry"
                : loading
                ? "Saving…"
                : "Save entry"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search in your diary…"
          style={{
            flex: "1 1 180px",
            padding: 6,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 13,
          }}
        />
        <select
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
          style={{
            padding: 6,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 13,
          }}
        >
          <option value="">All moods</option>
          {MOODS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: 6,
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 13,
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Entries list */}
      <div style={{ marginTop: 8 }}>
        {filteredEntries.length === 0 ? (
          <p style={{ fontSize: 13, color: "#777" }}>
            No entries yet here. Your story (and your little memories) start
            whenever you are ready 💗
          </p>
        ) : (
          filteredEntries.map((e) => {
            const moodMeta = MOODS.find((m) => m.key === e.mood);
            return (
              <div
                key={e._id}
                style={{
                  padding: 10,
                  border: "1px solid #eee",
                  marginBottom: 8,
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {new Date(e.date || e.createdAt).toLocaleString()}
                    {e.category && (
                      <span style={{ marginLeft: 6 }}>• {e.category}</span>
                    )}
                    {e.cyclePhase && e.cyclePhase !== "Not sure" && (
                      <span style={{ marginLeft: 6 }}>
                        • {e.cyclePhase} phase
                      </span>
                    )}
                    {e.private && <span> • 🔒</span>}
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    {moodMeta && (
                      <span title={moodMeta.label}>{moodMeta.emoji}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(e)}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 12,
                        cursor: "pointer",
                        color: "#1976d2",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e._id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 12,
                        cursor: "pointer",
                        color: "#d32f2f",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {e.title && (
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    {e.title}
                  </div>
                )}

                {/* Photos gallery */}
                {e.photos && e.photos.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 6,
                      marginTop: 4,
                    }}
                  >
                    {e.photos.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 80,
                          height: 80,
                          overflow: "hidden",
                          borderRadius: 8,
                        }}
                      >
                        <img
                          src={`${SERVER_BASE}${p}`}
                          alt="memory"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    color: "#333",
                  }}
                >
                  {e.text}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
