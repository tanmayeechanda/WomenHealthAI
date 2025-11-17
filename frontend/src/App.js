import React, { useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);

  function handleAuthSuccess(newToken, userData) {
    setToken(newToken);
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  }

  const isLoggedIn = !!token;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffe4ec, #e0f2fe)",
        padding: "16px",
      }}
    >
      {isLoggedIn ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
