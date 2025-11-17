import React, { useState } from "react";

function App() {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const API_BASE = "http://localhost:4000/api";

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

      // Save token and show success
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }
      setStatus(`Success! Logged in as ${data.user?.email || email}`);
    } catch (err) {
      console.error(err);
      setStatus("Network error");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setStatus("Logged out");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffe4ec, #e0f2fe)",
      }}
    >
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

        <div style={{ display: "flex", marginBottom: "16px" }}>
          <button
            onClick={() => setMode("login")}
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
            onClick={() => setMode("register")}
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
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.9rem",
            }}
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
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.9rem",
            }}
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

        {token && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "8px",
              borderTop: "1px solid #e5e7eb",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              ✅ You are logged in.
              <br />
              <span style={{ color: "#6b7280" }}>
                Token is stored in localStorage.
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid #ef4444",
                background: "white",
                color: "#b91c1c",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
