// frontend/src/components/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Updating password...");

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Something went wrong");
        return;
      }

      setStatus(data.message || "Password updated successfully!");

      // After a short delay, go back to login
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffe4ec, #e0f2fe)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>
          Reset your password
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: 16,
            fontSize: "0.9rem",
            color: "#4b5563",
          }}
        >
          Enter a new password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: "0.9rem",
            }}
          >
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              required
            />
          </label>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 999,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Update password
          </button>
        </form>

        {status && (
          <div
            style={{
              marginTop: 12,
              fontSize: "0.85rem",
              color: status.toLowerCase().includes("success")
                ? "#065f46"
                : "#b91c1c",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
