// frontend/src/components/PeriodLogger.jsx
import React from "react";
const API_BASE = "http://localhost:4000/api";

export default function PeriodLogger({ onLogged }) {
  async function startPeriod() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/period/entry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        startDate: new Date().toISOString(),
        flow: "moderate",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(
        "Period START logged: " + new Date(data.startDate).toLocaleDateString()
      );
      if (onLogged) onLogged();
    } else {
      alert(data.error || "Error logging period start");
    }
  }

  async function endPeriod() {
    // quick UX: ask user to set end date (better to implement update endpoint)
    const end = new Date().toISOString();
    alert(
      "To mark end, use the period update endpoint (not implemented). For now you can log a new entry manually."
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Period logger</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={startPeriod} style={{ padding: "8px 12px" }}>
          Mark START
        </button>
        <button onClick={endPeriod} style={{ padding: "8px 12px" }}>
          Mark END
        </button>
      </div>
    </div>
  );
}
