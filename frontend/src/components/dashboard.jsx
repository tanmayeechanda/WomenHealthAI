import React, { useState } from "react";
import AIChatVoice from "./AIChatVoice";
import MoodSuggest from "./MoodSuggest";
import PeriodLogger from "./PeriodLogger";
import Diary from "./Diary";
import GameSuggestions from "./GameSuggestions";
import BookSuggestions from "./BookSuggestions";
import WellnessPage from "./WellnessPage";

function Dashboard({ user, token, onLogout }) {
  const [activeSection, setActiveSection] = useState("voice"); // main tabs
  const [suggestionTab, setSuggestionTab] = useState("mood"); // 'mood' | 'games' | 'books'

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

  const subButtonStyle = (isActive) => ({
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid",
    borderColor: isActive ? "#2563eb" : "#d1d5db",
    backgroundColor: isActive ? "#2563eb" : "white",
    color: isActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
  });

  const renderSuggestionsSection = () => {
    return (
      <div>
        {/* Sub-tabs: Mood / Book / Game */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <button
            style={subButtonStyle(suggestionTab === "mood")}
            onClick={() => setSuggestionTab("mood")}
          >
            Mood
          </button>
          <button
            style={subButtonStyle(suggestionTab === "books")}
            onClick={() => setSuggestionTab("books")}
          >
            Books
          </button>
          <button
            style={subButtonStyle(suggestionTab === "games")}
            onClick={() => setSuggestionTab("games")}
          >
            Games
          </button>
        </div>

        {/* Content for selected suggestion type */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#f9fafb",
          }}
        >
          {suggestionTab === "mood" && <MoodSuggest />}
          {suggestionTab === "books" && <BookSuggestions token={token} />}
          {suggestionTab === "games" && <GameSuggestions token={token} />}
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "voice":
        return <AIChatVoice />;
      case "suggestions":
        return renderSuggestionsSection();
      case "period":
        return <PeriodLogger />;
      case "diary":
        return <Diary />;
      case "wellness":
        return <WellnessPage token={token} />;
      default:
        return <AIChatVoice />;
    }
  };

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

      {/* Main Navigation Bar */}
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
          style={navButtonStyle(activeSection === "suggestions")}
          onClick={() => setActiveSection("suggestions")}
        >
          Suggestions
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
          style={navButtonStyle(activeSection === "wellness")}
          onClick={() => setActiveSection("wellness")}
        >
          Personal Wellness
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
