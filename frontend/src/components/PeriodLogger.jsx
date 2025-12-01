import React, { useState, useEffect, useCallback } from "react";
// 🆕 Import the calendar component
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const API_BASE = "http://localhost:4000/api";

export default function PeriodLogger({ onLogged }) {
  const [cycleStats, setCycleStats] = useState({
    phase: "Unknown",
    nextDate: null,
    daysUntil: null,
  });
  const [loading, setLoading] = useState(true);
  // 🆕 State for the Calendar value (stores the selected date)
  const [calendarValue, onCalendarChange] = useState(new Date());
  // State to hold all past period dates for highlighting
  const [loggedDates, setLoggedDates] = useState([]);

  // The Core Logic for Prediction & Phases (No changes here)
  function calculateCycleLogic(startDateStr) {
    const start = new Date(startDateStr);
    const today = new Date();

    // Calculate days passed since last period start
    const diffTime = Math.abs(today - start);
    const dayOfCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Standard Cycle Assumption: 28 Days
    const cycleLength = 28;

    // Predict Next Date
    const nextPeriod = new Date(start);
    nextPeriod.setDate(start.getDate() + cycleLength);

    // Days remaining
    const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

    // Determine Phase
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
  }

  // Fetch History function (now also sets loggedDates for the calendar)
  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/period/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.length > 0) {
        // Extracting all start dates for the calendar
        const dates = data.map((entry) => new Date(entry.startDate));
        setLoggedDates(dates);

        // Sort to find the latest for prediction logic
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
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Log Function
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
      fetchHistory(); // Refresh data immediately
      if (onLogged) onLogged();
    } else {
      alert("Error logging period.");
    }
  }

  // 🆕 Function to determine which days to highlight on the calendar
  const tileClassName = ({ date, view }) => {
    // Only apply colors to day view
    if (view === "month") {
      const isLogged = loggedDates.some(
        (loggedDate) => loggedDate.toDateString() === date.toDateString()
      );

      if (isLogged) {
        return "highlight-period"; // Apply custom CSS class
      }
    }
  };

  // --- STYLES ---
  const containerStyle = {
    background: "#fff",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    maxWidth: "800px", // Increased width for the calendar
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    gap: "20px",
  };

  const infoPanelStyle = {
    flex: 1, // Takes up half the space
  };

  const calendarPanelStyle = {
    flex: 1, // Takes up half the space
    minWidth: "350px",
  };

  const gridStyle = {
    display: "flex", // Changed to flex for vertical stacking of info cards
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  };

  const cardStyle = {
    background: "#fdf2f8", // Very light pink
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #fbcfe8",
  };

  const btnStyle = {
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
  };

  // 🆕 Custom styles for the Calendar container to match the app theme
  const customCalendarStyle = `
    .react-calendar {
      border: 1px solid #fbcfe8 !important; 
      border-radius: 12px !important; 
      font-family: 'Segoe UI', sans-serif !important;
    }
    .react-calendar__tile--active,
    .react-calendar__tile--rangeStart,
    .react-calendar__tile--rangeEnd {
      background: #db2777 !important;
      color: white !important;
    }
    .highlight-period {
      background: #f0abfc !important; /* Light purple for period */
      color: white !important;
      border-radius: 50%;
      font-weight: bold;
    }
    .react-calendar__month-view__weekdays__weekday abbr {
        text-decoration: none;
        font-weight: bold;
        color: #831843;
    }
  `;

  if (loading) return <div>Loading your cycle data...</div>;

  return (
    <div style={containerStyle}>
      {/* 1. Info Panel (Cycle Forecast + Inner Season) */}
      <div style={infoPanelStyle}>
        <h3 style={{ color: "#831843", margin: "0 0 10px 0" }}>
          🌸 Cycle Overview
        </h3>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Manage your monthly health
        </p>

        <div style={gridStyle}>
          {/* Cycle Forecast Card */}
          <div style={cardStyle}>
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
          <div style={cardStyle}>
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
            <button onClick={logPeriodStart} style={btnStyle}>
              Start Today
            </button>
            <button
              onClick={() => alert("Marking end feature coming soon!")}
              style={{ ...btnStyle, background: "#fce7f3", color: "#831843" }}
            >
              End Today
            </button>
          </div>
        </div>
      </div>

      {/* 2. Calendar Panel */}
      <div style={calendarPanelStyle}>
        <h4 style={{ color: "#831843", marginTop: "0" }}>
          📅 Cycle Visualizer
        </h4>
        {/* 🆕 Inject custom styles for the calendar */}
        <style dangerouslySetInnerHTML={{ __html: customCalendarStyle }} />

        <Calendar
          onChange={onCalendarChange}
          value={calendarValue}
          tileClassName={tileClassName} // Use the tile class function
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
