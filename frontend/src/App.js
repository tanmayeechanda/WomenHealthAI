// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/dashboard";
import ResetPassword from "./components/ResetPassword"; // make sure this file exists
import "react-calendar/dist/Calendar.css";

const API_BASE = "http://localhost:4000/api";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [checkingToken, setCheckingToken] = useState(!!token);

  // Called when login/register succeeds
  const handleAuthSuccess = (newToken, userData) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // Verify token & fetch user on first load / token change
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setCheckingToken(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // token invalid/expired -> logout
          localStorage.removeItem("token");
          setToken("");
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error verifying token:", err);
        // in doubt, log out
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
      } finally {
        setCheckingToken(false);
      }
    }

    checkToken();
  }, [token]);

  // This controls what shows at "/"
  const AppShell = () => {
    if (checkingToken) {
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
          <div>Checking session...</div>
        </div>
      );
    }

    if (!token) {
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
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      );
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
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      </div>
    );
  };

  return (
    <Routes>
      {/* Main app (login or dashboard) */}
      <Route path="/" element={<AppShell />} />

      {/* Password reset page from email link */}
      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
