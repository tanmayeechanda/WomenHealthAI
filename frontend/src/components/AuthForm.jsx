import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = "http://localhost:4000/api";

function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  // For reset password
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Loading...");

    try {
      const endpoint =
        mode === "login"
          ? `${API_BASE}/auth/login`
          : `${API_BASE}/auth/register`;

      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password, dob: dob || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Something went wrong");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(data.token, data.user || null);
        }
      }

      setStatus(`Success! Logged in as ${data.user?.email || email}`);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const credential = credentialResponse.credential;
      if (!credential) {
        console.error("No credential from Google");
        setStatus("Google login failed");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Google login failed:", data);
        setStatus(data.error || "Google login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(data.token, data.user || null);
        }
      }

      setStatus(`Success! Logged in as ${data.user?.email || "Google user"}`);
    } catch (err) {
      console.error("Google login error:", err);
      setStatus("Google login error");
    }
  }

  function handleGoogleError() {
    console.error("Google login was unsuccessful");
    setStatus("Google sign-in was cancelled or failed");
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setResetStatus("Sending reset link...");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetStatus(data.error || "Something went wrong");
        return;
      }

      setResetStatus(
        data.message || "If this email exists, a reset link was sent."
      );
    } catch (err) {
      console.error(err);
      setResetStatus("Network error");
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus("");
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
        Women&apos;s Health AI
      </h1>
      <p
        style={{
          textAlign: "center",
          marginBottom: "16px",
          fontSize: "0.9rem",
        }}
      >
        {mode === "login"
          ? "Login to continue tracking your cycle & chat with the AI."
          : "Create your account to track your cycles and get AI support."}
      </p>

      {/* Login / Sign up toggle */}
      <div style={{ display: "flex", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => switchMode("login")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "8px 0 0 8px",
            border: "1px solid #e5e7eb",
            background: mode === "login" ? "#2563eb" : "white",
            color: mode === "login" ? "white" : "#111827",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "0 8px 8px 0",
            border: "1px solid #e5e7eb",
            borderLeft: "none",
            background: mode === "register" ? "#2563eb" : "white",
            color: mode === "register" ? "white" : "#111827",
            cursor: "pointer",
          }}
        >
          Sign up
        </button>
      </div>

      {/* Main auth form */}
      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
              }}
            >
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                required
              />
            </label>

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "0.9rem",
              }}
            >
              Date of Birth (optional)
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
            </label>
          </>
        )}

        <label
          style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}
        >
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              marginBottom: "8px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            required
          />
        </label>

        <label
          style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem" }}
        >
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              marginBottom: "8px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            required
          />
        </label>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "999px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "8px",
          }}
        >
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      {/* Google Sign-in */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="pill"
          text="continue_with"
        />
      </div>

      {/* Main auth status */}
      {status && (
        <div
          style={{
            marginTop: "12px",
            fontSize: "0.85rem",
            color: status.toLowerCase().includes("success")
              ? "#065f46"
              : "#b91c1c",
          }}
        >
          {status}
        </div>
      )}

      {/* Forgot password section */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid #e5e7eb",
          fontSize: "0.85rem",
        }}
      >
        <div style={{ marginBottom: "4px", fontWeight: 500 }}>
          Forgot your password?
        </div>
        <form
          onSubmit={handleForgotPassword}
          style={{ display: "flex", gap: 8, marginTop: 4 }}
        >
          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            required
          />
          <button
            type="submit"
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              border: "none",
              background: "#6b21a8",
              color: "white",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Reset
          </button>
        </form>
        {resetStatus && (
          <div style={{ marginTop: 4, color: "#4b5563" }}>{resetStatus}</div>
        )}
      </div>
    </div>
  );
}

export default AuthForm;
