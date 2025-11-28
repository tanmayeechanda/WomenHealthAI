// frontend/src/components/WellnessPage.jsx
import React, { useEffect, useState } from "react";

const BASE_URL = "http://localhost:4000"; // make sure this matches your backend port

const phaseLabels = {
  menstrual: "Menstrual (bleeding days)",
  follicular: "Follicular (energy rising)",
  ovulatory: "Ovulatory (around ovulation)",
  luteal: "Luteal (PMS / pre-period)",
  unknown: "Unknown",
};

function WellnessPage({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileUploading, setFileUploading] = useState(false);

  // editable fields
  const [dos, setDos] = useState("");
  const [donts, setDonts] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const [nextAppointmentDate, setNextAppointmentDate] = useState("");
  const [nextAppointmentDoctor, setNextAppointmentDoctor] = useState("");
  const [nextAppointmentLocation, setNextAppointmentLocation] = useState("");
  const [nextAppointmentNotes, setNextAppointmentNotes] = useState("");

  // load wellness profile
  useEffect(() => {
    if (!token) {
      setError("You must be logged in to view your wellness page.");
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/api/wellness/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          let message = "Failed to load wellness data";
          try {
            const json = JSON.parse(text);
            if (json.error) message = json.error;
          } catch {}
          throw new Error(message);
        }
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data) {
          setProfile(data);
          setDos(data.dos || "");
          setDonts(data.donts || "");
          setMedicalConditions(data.medicalConditions || "");
          setExtraNotes(data.extraNotes || "");

          if (data.nextAppointmentDate) {
            const d = new Date(data.nextAppointmentDate);
            setNextAppointmentDate(d.toISOString().slice(0, 10));
          }
          setNextAppointmentDoctor(data.nextAppointmentDoctor || "");
          setNextAppointmentLocation(data.nextAppointmentLocation || "");
          setNextAppointmentNotes(data.nextAppointmentNotes || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Wellness load error:", err);
        setError(err.message || "Could not load your wellness info.");
        setLoading(false);
      });
  }, [token]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError("");

    const body = {
      dos,
      donts,
      medicalConditions,
      extraNotes,
      nextAppointmentDate: nextAppointmentDate || null,
      nextAppointmentDoctor,
      nextAppointmentLocation,
      nextAppointmentNotes,
    };

    fetch(`${BASE_URL}/api/wellness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          let message = "Failed to save wellness info";
          try {
            const json = JSON.parse(text);
            if (json.error) message = json.error;
          } catch {}
          throw new Error(message);
        }
        return JSON.parse(text);
      })
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Wellness save error:", err);
        setError(err.message || "Could not save your wellness info.");
      })
      .finally(() => setSaving(false));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setFileError("");
    setFileUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    fetch(`${BASE_URL}/api/wellness/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          let message = "Failed to upload report";
          try {
            const json = JSON.parse(text);
            if (json.error) message = json.error;
          } catch {}
          throw new Error(message);
        }
        return JSON.parse(text);
      })
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Report upload error:", err);
        setFileError(err.message || "Could not upload this file.");
      })
      .finally(() => setFileUploading(false));
  };

  if (loading) return <p>Loading your wellness page…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const reports = profile?.medicalReports || [];
  const cycleDay = profile?.cycleDay;
  const phase = profile?.currentCyclePhase || "unknown";
  const inPeriodNow = profile?.inPeriodNow;
  const reminder = profile?.appointmentReminder;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Personal Wellness 🌸</h2>
      <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
        Your private health hub: cycle overview, your own rules, medical
        history, appointments and reports.
      </p>

      {/* Appointment reminder banner */}
      {reminder && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#fef3c7",
            border: "1px solid #fbbf24",
            fontSize: 14,
          }}
        >
          <strong>Doctor reminder: </strong>
          {reminder.message}
        </div>
      )}

      {/* Cycle overview */}
      <section
        style={{
          marginBottom: 20,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Cycle overview 🩸</h3>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Current phase:</strong> {phaseLabels[phase] || "Unknown"}
        </p>
        <p style={{ margin: "4px 0", fontSize: 14 }}>
          <strong>Cycle day:</strong> {cycleDay || "Not sure"}
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Currently on period:</strong>{" "}
          {inPeriodNow ? "Yes" : "No / Not detected"}
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          These are auto-guessed from your period logs. Update your periods
          regularly in the Period Logger for better accuracy.
        </p>
      </section>

      {/* Form: personal rules + medical history + appointment */}
      <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
        {/* Do's & Don'ts */}
        <section>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            My personal rules ✅❌
          </h3>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              My do&apos;s
            </label>
            <textarea
              value={dos}
              onChange={(e) => setDos(e.target.value)}
              rows={3}
              placeholder="e.g., warm water, light walks, sleep early, gentle stretching…"
              style={{
                marginTop: 4,
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              My don&apos;ts
            </label>
            <textarea
              value={donts}
              onChange={(e) => setDonts(e.target.value)}
              rows={3}
              placeholder="e.g., heavy workouts on day 1–2, too much caffeine, skipping meals…"
              style={{
                marginTop: 4,
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </div>
        </section>

        {/* Medical history + appointment */}
        <section>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Medical history 🩺</h3>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              Conditions / notes for doctor
            </label>
            <textarea
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              rows={3}
              placeholder="e.g., PCOS, endometriosis, anemia, migraines, allergies, medications…"
              style={{
                marginTop: 4,
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              Extra notes to myself
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={3}
              placeholder="Anything else about your body, triggers, patterns you notice…"
              style={{
                marginTop: 4,
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
            />
          </div>

          <h4 style={{ marginTop: 12, marginBottom: 4 }}>
            Next doctor appointment 📅
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <label style={{ fontSize: 14 }}>Date</label>
              <input
                type="date"
                value={nextAppointmentDate}
                onChange={(e) => setNextAppointmentDate(e.target.value)}
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14 }}>Doctor / Department</label>
              <input
                type="text"
                value={nextAppointmentDoctor}
                onChange={(e) => setNextAppointmentDoctor(e.target.value)}
                placeholder="e.g., Dr. Sharma – Gynecologist"
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <label style={{ fontSize: 14 }}>Hospital / Clinic</label>
              <input
                type="text"
                value={nextAppointmentLocation}
                onChange={(e) => setNextAppointmentLocation(e.target.value)}
                placeholder="e.g., Apollo Hospital, Vijayawada"
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14 }}>Notes</label>
              <textarea
                value={nextAppointmentNotes}
                onChange={(e) => setNextAppointmentNotes(e.target.value)}
                rows={2}
                placeholder="e.g., ask about cramps on day 2, check iron levels…"
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#6b7280" }}>
            The app will gently remind you in the week before your appointment,
            up to two times, when you visit this page.
          </p>
        </section>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 4,
            alignSelf: "flex-start",
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid #ec4899",
            backgroundColor: saving ? "#f9a8d4" : "#ec4899",
            color: "white",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save wellness info"}
        </button>
      </form>

      {/* Reports separate section */}
      <section style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Medical reports 📁</h3>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
          Upload lab reports, ultrasound results, prescriptions you want to keep
          handy. Only you can see these.
        </p>

        <input
          type="file"
          onChange={handleFileUpload}
          disabled={fileUploading}
          style={{ marginBottom: 8 }}
        />
        {fileUploading && <p style={{ fontSize: 13 }}>Uploading report…</p>}
        {fileError && <p style={{ color: "red", fontSize: 13 }}>{fileError}</p>}

        {reports.length > 0 ? (
          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
            {reports.map((r, idx) => (
              <li key={idx} style={{ fontSize: 13, marginBottom: 4 }}>
                <a
                  href={`${BASE_URL}${r.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#ec4899", textDecoration: "none" }}
                >
                  {r.originalName || r.filename}
                </a>{" "}
                <span style={{ color: "#9ca3af" }}>
                  ({new Date(r.uploadedAt).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            No reports uploaded yet.
          </p>
        )}
      </section>
    </div>
  );
}

export default WellnessPage;
