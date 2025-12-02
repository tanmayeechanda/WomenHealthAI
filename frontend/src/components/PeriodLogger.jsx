import React, { useState, useEffect, useCallback } from "react";
// 🆕 Import React Day Picker components and styles
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
// Helper for date comparison (replacing toDateString comparison)
import { isSameDay } from "date-fns";

const API_BASE = "http://localhost:4000/api";

// --- START: STYLES AND CONSTANTS ---
// We will use the custom classes built into the DayPicker style sheet
// but keep the structural styles for the layout
const styles = {
  container: {
    background: "#fff",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    gap: "20px",
  },
  infoPanel: {
    flex: 1,
  },
  calendarPanel: {
    flex: 1,
    minWidth: "350px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  card: {
    background: "#fdf2f8", // Very light pink
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #fbcfe8",
  },
  btnPrimary: {
    background: "#db2777", // Pink-600
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    width: "100%",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "0.3s",
  },
  btnSecondary: {
    background: "#fce7f3",
    color: "#831843",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    width: "100%",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "0.3s",
  },
};
// --- END: STYLES AND CONSTANTS ---

export default function PeriodLogger({ onLogged }) {
  const [cycleStats, setCycleStats] = useState({
    phase: "Unknown",
    nextDate: null,
    daysUntil: null,
  });
  const [loading, setLoading] = useState(true);
  // loggedDates holds Date objects from the backend
  const [loggedDates, setLoggedDates] = useState([]);

  const calculateCycleLogic = useCallback((startDateStr) => {
    const start = new Date(startDateStr);
    const today = new Date();

    const diffTime = Math.abs(today - start);
    const dayOfCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const cycleLength = 28;

    const nextPeriod = new Date(start);
    nextPeriod.setDate(start.getDate() + cycleLength);

    const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

    let currentPhase = "";
    if (dayOfCycle >= 1 && dayOfCycle <= 5)
      currentPhase = "Menstrual Phase (Winter)";
    else if (dayOfCycle >= 6 && dayOfCycle <= 13)
      currentPhase = "Follicular Phase (Spring)";
    else if (dayOfCycle === 14) currentPhase = "Ovulation (Summer)";
    else if (dayOfCycle > 14 && dayOfCycle <= 28)
      currentPhase = "Luteal Phase (Autumn)";
    else currentPhase = "Late / Irregular";

    setCycleStats({
      phase: currentPhase,
      nextDate: nextPeriod.toDateString(),
      daysUntil: daysUntil,
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/period/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.length > 0) {
        // Map data to Date objects for day-picker
        const dates = data.map((entry) => new Date(entry.startDate));
        setLoggedDates(dates);

        const sorted = data.sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );
        const latest = sorted[0].startDate;
        calculateCycleLogic(latest);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  }, [calculateCycleLogic]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function logPeriodStart() {
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

    if (res.ok) {
      alert("Cycle Started! Tracking updated.");
      fetchHistory();
      if (onLogged) onLogged();
    } else {
      alert("Error logging period.");
    }
  }

  // Define the custom class name for logged days
  const modifiersClassNames = {
    logged: "day-picker-logged", // Custom class name
  };

  // Define the modifier function using date-fns
  const modifiers = {
    logged: (date) =>
      loggedDates.some((loggedDate) => isSameDay(loggedDate, date)),
  };

  if (loading) return <div>Loading your cycle data...</div>;

  return (
    <div style={styles.container}>
      {/* 1. Info Panel (Cycle Forecast + Inner Season) */}
      <div style={styles.infoPanel}>
        <h3 style={{ color: "#831843", margin: "0 0 10px 0" }}>
          🌸 Cycle Overview
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Manage your monthly health
        </p>

        <div style={styles.grid}>
          {/* Cycle Forecast Card */}
          <div style={styles.card}>
            <div style={{ fontSize: "24px" }}>🔮</div>
            <h4 style={{ margin: "10px 0 5px", color: "#831843" }}>
              Cycle Forecast
            </h4>
            <p style={{ fontSize: "13px", color: "#555" }}>
              Next Period:
              <br />
              <strong>{cycleStats.nextDate || "No data yet"}</strong>
            </p>
            <small style={{ color: "#db2777" }}>
              {cycleStats.daysUntil
                ? `${cycleStats.daysUntil} Days to go`
                : "Log a period first"}
            </small>
          </div>

          {/* Inner Season Card */}
          <div style={styles.card}>
            <div style={{ fontSize: "24px" }}>🌙</div>
            <h4 style={{ margin: "10px 0 5px", color: "#831843" }}>
              Inner Season
            </h4>
            <p style={{ fontSize: "13px", color: "#555" }}>
              Current Status:
              <br />
              <strong>{cycleStats.phase}</strong>
            </p>
            <small style={{ color: "#db2777" }}>Stay hydrated!</small>
          </div>
        </div>

        {/* Action Button (Logging) */}
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <h4 style={{ margin: "0 0 10px", color: "#831843" }}>
            📝 Log Your Flow
          </h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={logPeriodStart} style={styles.btnPrimary}>
              Start Today
            </button>
            <button
              onClick={() => alert("Marking end feature coming soon!")}
              style={styles.btnSecondary}
            >
              End Today
            </button>
          </div>
        </div>
      </div>

      {/* 2. Calendar Panel */}
      <div style={styles.calendarPanel}>
        <h4 style={{ color: "#831843", marginTop: "0" }}>
          📅 Cycle Visualizer
        </h4>

        {/* Inject custom styling for the logged days */}
        <style>{`
          .day-picker-logged {
            background-color: #f0abfc !important; /* Light purple for period */
            color: white !important;
            border-radius: 50%;
            font-weight: bold;
          }
          /* Customizing the main DayPicker container to match theme */
          .rdp { 
            border: 1px solid #fbcfe8; 
            border-radius: 12px;
            padding: 10px;
          }
          .rdp-day_selected:not(.rdp-day_outside) {
            background-color: #db2777; /* Pink-600 */
          }
        `}</style>

        <DayPicker
          mode="single" // Allows selection of one day (for potential future logging)
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          // If you want to disable selecting future dates for logging:
          // disabled={{ after: new Date() }}
        />

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <span
            style={{
              height: "10px",
              width: "10px",
              backgroundColor: "#f0abfc",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "5px",
            }}
          ></span>
          <small style={{ color: "#831843" }}>Logged Period Day</small>
        </div>
      </div>
    </div>
  );
}
