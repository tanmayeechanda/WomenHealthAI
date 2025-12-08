// frontend/src/App.js
import React, { useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/dashboard";
import "react-calendar/dist/Calendar.css";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // This will be called by AuthForm when login / register succeeds
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
    localStorage.removeItem("token"); // same key you used to store it
    setToken("");
    setUser(null);
  };

  if (!token) {
    // 🔴 IMPORTANT: use onAuthSuccess, not setUser/setToken separately
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}

export default App;
