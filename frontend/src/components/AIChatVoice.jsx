// frontend/src/components/AIChatVoice.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:4000/api";

export default function AIChatVoice() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi love, I’m your wellness voice assistant. 💜 You can talk to me like a friend, or ask me to do things for you.",
    },
    {
      role: "assistant",
      content:
        "For example, you can say things like:\n• “Fix an appointment with Dr Sricharan on 11 December 2025 at 12 pm”\n• “Write in my diary that I felt very anxious in class today”\n• “Which doctor should I see for heavy periods in Hyderabad?”\n• “My period started today”\n• “I feel very low and lonely today”",
    },
  ]);
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [pendingText, setPendingText] = useState(""); // recognized text (editable)

  const recognitionRef = useRef(null);

  /* ---------------- TEXT TO SPEECH ---------------- */
  function speak(text) {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.log("TTS error:", err);
    }
  }

  /* ------------- SEND CONFIRMED TEXT TO AI -------- */
  async function sendToAI(text) {
    if (!text.trim()) return;

    const token = localStorage.getItem("token");
    setTyping(true);

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

      if (!res.ok) {
        const fallback =
          data.error || "Something went wrong while talking to me.";
        setMessages((m) => [...m, { role: "assistant", content: fallback }]);
        speak(fallback);
        return;
      }

      const reply = data.text || "I'm here for you.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      speak(reply);

      // 🔹 If you ever want, you can also use data.intent here
      // e.g. data.intent?.type === "appointment_created"
      // For now, reply text already explains what happened.
    } catch (err) {
      console.log("AI error:", err);
      const fallback =
        "I couldn't reach the server right now, but I'm still here to listen.";
      setMessages((m) => [...m, { role: "assistant", content: fallback }]);
      speak(fallback);
    } finally {
      setTyping(false);
    }
  }

  /* --------------- HANDLE SEND BUTTON -------------- */
  async function handleSendPending() {
    const text = pendingText.trim();
    if (!text) return;

    // show in chat as user message
    setMessages((m) => [...m, { role: "user", content: text }]);
    setPendingText("");

    await sendToAI(text);
  }

  /* --------------- INIT SPEECH RECOGNITION --------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      console.warn("Speech Recognition is not supported in this browser.");
      return;
    }

    const recog = new SR();
    recog.lang = "en-IN"; // try also "en-US" or "hi-IN" if you want
    recog.continuous = false; // one utterance per click
    recog.interimResults = true; // we gather final transcript at the end
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      console.log("🎤 recognition started");
      setListening(true);
    };

    recog.onend = () => {
      console.log("🛑 recognition ended");
      setListening(false);
    };

    recog.onerror = (e) => {
      console.log("❌ Speech error:", e.error);
      setListening(false);

      if (e.error === "no-speech") {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "I couldn't hear anything that time. Try speaking a little closer or louder, or you can type instead.",
          },
        ]);
      }
    };

    recog.onresult = (e) => {
      let finalTranscript = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
      }

      const text = finalTranscript.trim();
      if (!text) {
        console.log("No final transcript (only interim or silence).");
        return;
      }

      console.log("✅ Recognized:", text);
      // show in editable box instead of sending directly
      setPendingText(text);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch {}
    };
  }, []); // runs once

  /* ----------------- START LISTENING BUTTON -------- */
  function startListening() {
    const recog = recognitionRef.current;
    if (!recog) {
      alert(
        "Speech recognition is not available in this browser. Try using Chrome on desktop."
      );
      return;
    }

    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        recog.stop();
      } catch {}

      setTimeout(() => {
        console.log("▶️ calling recog.start()");
        recog.start();
      }, 200);
    } catch (err) {
      console.log("Start listening error:", err);
    }
  }

  /* --------------------------- UI ------------------- */
  return (
    <div
      style={{
        padding: 20,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 10,
          color: "#6b21a8",
          fontWeight: 600,
        }}
      >
        💜 Wellness Voice Assistant
      </h2>

      {/* Chat window */}
      <div
        style={{
          height: 260,
          overflowY: "auto",
          padding: 12,
          borderRadius: 16,
          background: "#faf5ff",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              margin: "6px 0",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div
              style={{
                background: m.role === "user" ? "#dbeafe" : "#f3e8ff",
                padding: "8px 12px",
                borderRadius: 14,
                maxWidth: "75%",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                fontSize: 14,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {typing && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "#f3e8ff",
              borderRadius: 14,
              width: 52,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div className="typing-dots" />
          </div>
        )}
      </div>

      {/* Recognized text editor */}
      {pendingText && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            background: "#fef3c7",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              marginBottom: 6,
              color: "#92400e",
              fontWeight: 500,
            }}
          >
            Recognized text (you can edit before sending):
          </div>
          <textarea
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #fbbf24",
              padding: 6,
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
            }}
          />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              onClick={handleSendPending}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: "#4ade80",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send ✅
            </button>
            <button
              onClick={() => setPendingText("")}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 8,
                border: "none",
                background: "#fca5a5",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear ❌
            </button>
          </div>
        </div>
      )}

      {/* Mic button */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "none",
            background: listening ? "#fb7185" : "#c084fc",
            boxShadow: listening
              ? "0 0 20px rgba(251, 113, 133, 0.7)"
              : "0 0 14px rgba(192, 132, 252, 0.7)",
            cursor: "pointer",
            transition: "0.25s",
          }}
        >
          <span
            style={{
              fontSize: 30,
              color: "white",
              animation: listening ? "pulse 1s infinite" : "none",
            }}
          >
            🎤
          </span>
        </button>
      </div>

      {/* How to talk to her (text hints, in case mic fails) */}
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "#6b7280",
          background: "#eff6ff",
          padding: 8,
          borderRadius: 10,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          You can say things like:
        </div>
        <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 2 }}>
          <li>
            <strong>Appointment:</strong> “Fix an appointment with Dr Sricharan
            on 11 December 2025 at 12 pm”
          </li>
          <li>
            <strong>Diary:</strong> “Write in my diary that I felt very anxious
            in class today”
          </li>
          <li>
            <strong>Doctor type:</strong> “Which doctor should I see for heavy
            periods in Hyderabad?”
          </li>
          <li>
            <strong>Periods:</strong> “My period started today”
          </li>
          <li>
            <strong>Emotional:</strong> “I feel really low and lonely today”
          </li>
        </ul>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.85; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .typing-dots {
            width: 36px;
            height: 8px;
            background: repeating-linear-gradient(
              to right,
              #9d4edd 0 8px,
              transparent 8px 12px
            );
            animation: blink 1s infinite;
          }

          @keyframes blink {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
}
