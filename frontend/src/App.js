// frontend/src/App.js
import React, { useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token")); // or your key

  const handleLogout = () => {
    localStorage.removeItem("token"); // same key you used to store it
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <AuthForm setUser={setUser} setToken={setToken} />;
  }

  return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}

export default App;
