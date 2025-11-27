import React, { useState } from "react";
import AIChatVoice from "./AIChatVoice";
import MoodSuggest from "./MoodSuggest";
import PeriodLogger from "./PeriodLogger";
import Diary from "./Diary";
import GameSuggestions from "./GameSuggestions";
import BookSuggestions from "./BookSuggestions";

function Dashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("voice");

  const renderSection = () => {
    switch (activeSection) {
      case "voice":
        return <AIChatVoice />;
      case "mood":
        return <MoodSuggest />;
      case "period":
        return <PeriodLogger />;
      case "diary":
        return <Diary />;
      case "games":
        return <GameSuggestions />;
      case "books":
        return <BookSuggestions />;
      default:
        return <AIChatVoice />;
    }
  };

  const navButtonStyle = (isActive) => ({
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid",
    borderColor: isActive ? "#ec4899" : "#d1d5db",
    backgroundColor: isActive ? "#ec4899" : "#f9fafb",
    color: isActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: isActive ? 600 : 500,
  });

  return (
    <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Welcome back 👋</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            {user?.email ? `Logged in as ${user.email}` : "You are logged in."}
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            height: 36,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            backgroundColor: "#f9fafb",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Navigation Bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <button
          style={navButtonStyle(activeSection === "voice")}
          onClick={() => setActiveSection("voice")}
        >
          Voice AI Assistant
        </button>
        <button
          style={navButtonStyle(activeSection === "mood")}
          onClick={() => setActiveSection("mood")}
        >
          Mood Suggestions
        </button>
        <button
          style={navButtonStyle(activeSection === "period")}
          onClick={() => setActiveSection("period")}
        >
          Period Logger
        </button>
        <button
          style={navButtonStyle(activeSection === "diary")}
          onClick={() => setActiveSection("diary")}
        >
          Personal Diary
        </button>
        <button
          style={navButtonStyle(activeSection === "games")}
          onClick={() => setActiveSection("games")}
        >
          Game Suggestions
        </button>
        <button
          style={navButtonStyle(activeSection === "books")}
          onClick={() => setActiveSection("books")}
        >
          Book Suggestions
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "white",
        }}
      >
        {renderSection()}
      </div>
    </div>
  );
}

export default Dashboard;
