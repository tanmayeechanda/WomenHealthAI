// frontend/src/components/BookSuggestions.jsx
import React, { useEffect, useState } from "react";

function BookSuggestions({ token }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("BookSuggestions: token =", token);

    if (!token) {
      setError("You must be logged in to view book suggestions.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:4000/api/resources/books", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("Books response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.log("Books error body:", text);
          throw new Error(text || "Failed to fetch books.");
        }

        return res.json();
      })
      .then((data) => {
        console.log("Books data:", data);
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Books fetch error:", err);
        setError(err.message || "Could not load book suggestions right now.");
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p>Loading book suggestions…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Book Suggestions 📚</h2>
      <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
        Tap a card to open the book’s info page in a new tab.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
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
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
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

export default BookSuggestions;
