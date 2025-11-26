import React from "react";
import AIChatVoice from "./AIChatVoice";
import MoodSuggest from "./MoodSuggest";
import PeriodLogger from "./PeriodLogger";
import Diary from "./Diary";

function Dashboard({ user, onLogout }) {
  return (
    <div style={{ width: "100%", maxWidth: 980 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h1>Welcome back 👋</h1>
          <p style={{ color: "#6b7280" }}>
            {user?.email ? `Logged in as ${user.email}` : "You are logged in."}
          </p>
        </div>
        <button onClick={onLogout} style={{ height: 36, padding: "0 16px" }}>
          Logout
        </button>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}
      >
        <div>
          <AIChatVoice />
          <MoodSuggest />
          <PeriodLogger />
        </div>

        <div>
          <Diary />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
