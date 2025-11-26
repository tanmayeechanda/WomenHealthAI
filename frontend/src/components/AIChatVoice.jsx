// frontend/src/components/AIChatVoice.jsx
import React, { useState, useRef, useEffect } from "react";
const API_BASE = "http://localhost:4000/api";

export default function AIChatVoice() {
  const [messages, setMessages] = useState([]); // {role, content}
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = "en-IN";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      pushUserMessage(text);
      sendToServer(text);
    };
    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, []);

  function pushUserMessage(text) {
    setMessages((m) => [...m, { role: "user", content: text }]);
  }

  async function sendToServer(text) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      const reply = data.text || "Sorry, try again later.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error contacting AI service." },
      ]);
    }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startListening() {
    const r = recognitionRef.current;
    if (!r) return alert("SpeechRecognition not supported in this browser");
    try {
      r.start();
      setListening(true);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <h3>Voice AI Assistant</h3>
      <div
        style={{
          height: 220,
          overflowY: "auto",
          border: "1px solid #eee",
          padding: 8,
          borderRadius: 8,
          background: "#fff",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              margin: "6px 0",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: m.role === "user" ? "#e0f2fe" : "#f3f4f6",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {m.content}
              </pre>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{ padding: "8px 12px" }}
        >
          {listening ? "Listening..." : "Speak"}
        </button>
        <button
          onClick={() =>
            speak("Hello, I am here to help. How are you feeling today?")
          }
        >
          Play sample
        </button>
      </div>
      <p style={{ fontSize: 12, color: "#7c7c7c" }}>
        Note: Mic permission required. Not a doctor — for emergencies call local
        services.
      </p>
    </div>
  );
}
