// frontend/src/components/BookSuggestions.jsx
import React from "react";

const books = [
  {
    title: "Set Boundaries, Find Peace",
    author: "Nedra Glover Tawwab",
    theme: "Boundaries • Emotional Health",
    description:
      "Practical guidance on saying no, protecting your energy, and building healthier relationships without guilt.",
  },
  {
    title: "The Body Keeps the Score",
    author: "Bessel van der Kolk",
    theme: "Trauma • Mind–Body Connection",
    description:
      "Explores how stress and trauma live in the body and shares science-backed paths toward healing and feeling safe again.",
  },
  {
    title: "31 Days of Self-Compassion",
    author: "Blair Nicole",
    theme: "Self-kindness • Daily Practice",
    description:
      "Short daily reflections and prompts to be gentler with yourself, especially on days when you feel not enough.",
  },
  {
    title: "The Let Them Theory",
    author: "Mel Robbins",
    theme: "Letting Go • Mental Peace",
    description:
      "Focuses on releasing control over others, choosing yourself, and saving mental energy for what truly matters.",
  },
];

function BookSuggestions() {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Book Suggestions 📚</h2>
      <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
        These books are focused on women’s mental health, boundaries, and
        emotional wellbeing. Read slowly, highlight freely, and come back to
        them whenever you need grounding.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {books.map((book) => (
          <div
            key={book.title}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 4 }}>{book.title}</h3>
            <p
              style={{
                margin: 0,
                marginBottom: 4,
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              {book.author} • {book.theme}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookSuggestions;
