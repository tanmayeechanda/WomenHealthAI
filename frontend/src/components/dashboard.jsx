import React from "react";

function Dashboard({ user, onLogout }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "720px",
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "4px" }}>Welcome back 👋</h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            {user?.email
              ? `Logged in as ${user.email}`
              : "You are logged in. Your token is stored securely in localStorage."}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            height: "36px",
            padding: "0 16px",
            borderRadius: "999px",
            border: "1px solid #ef4444",
            background: "white",
            color: "#b91c1c",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          borderRadius: "12px",
          background: "#eff6ff",
          fontSize: "0.9rem",
        }}
      >
        <strong>Women&apos;s Health Dashboard</strong>
        <p style={{ marginTop: "4px" }}>
          Here you will soon see:
          <br />• AI chat to relieve stress & answer period doubts
          <br />• Cycle tracking calendar & symptoms
          <br />• Mood tracking and monthly insights
        </p>
      </div>

      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "1px dashed #e5e7eb",
          fontSize: "0.9rem",
          color: "#6b7280",
        }}
      >
        <p style={{ marginBottom: "4px" }}>
          🔜 <strong>Next step:</strong> add the AI chat box here.
        </p>
        <p>
          This section will host your <em>&quot;Talk to AI&quot;</em> component
          so users can ask questions and get empathetic responses.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
