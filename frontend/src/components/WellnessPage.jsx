import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:4000/api";

function WellnessPage({ token }) {
  const [reports, setReports] = useState([]);
  const [reportForm, setReportForm] = useState({
    title: "",
    date: "",
    doctorName: "",
    hospital: "",
    notes: "",
  });
  const [reportFile, setReportFile] = useState(null); // 🔹 file for medical report

  const [aiFile, setAiFile] = useState(null); // 🔹 file for AI explanation
  const [reportExplanation, setReportExplanation] = useState("");

  const [doctorIssue, setDoctorIssue] = useState("");
  const [doctorCity, setDoctorCity] = useState("");
  const [doctorSuggestion, setDoctorSuggestion] = useState(null);

  const [remedySymptom, setRemedySymptom] = useState("");
  const [remedyPhase, setRemedyPhase] = useState("period");
  const [remedyResult, setRemedyResult] = useState(null);

  const [apptForm, setApptForm] = useState({
    doctorName: "",
    specialty: "",
    location: "",
    dateTime: "",
  });
  const [nextAppt, setNextAppt] = useState(null);

  // 🔹 Fetch reports (memoized to fix the React hook warning)
  const fetchReports = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/medical/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setReports(data);
  }, [token]);

  // 🔹 Fetch next appointment (also memoized)
  const fetchNextAppt = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/appointments/next`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setNextAppt(data);
  }, [token]);

  // 🔹 useEffect now depends on the memoized functions → no lint error on [token]
  useEffect(() => {
    if (!token) return;
    fetchReports();
    fetchNextAppt();
  }, [token, fetchReports, fetchNextAppt]);

  // 🔹 Upload & save medical report (with file)
  async function handleReportSubmit(e) {
    e.preventDefault();

    if (!reportFile) {
      alert("Please upload a report file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", reportForm.title);
    formData.append("date", reportForm.date);
    formData.append("doctorName", reportForm.doctorName);
    formData.append("hospital", reportForm.hospital);
    formData.append("notes", reportForm.notes);
    formData.append("file", reportFile); // MUST be "file" for backend multer

    const res = await fetch(`${API_BASE}/medical/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // DO NOT set Content-Type manually
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error saving report");
      return;
    }

    setReportForm({
      title: "",
      date: "",
      doctorName: "",
      hospital: "",
      notes: "",
    });
    setReportFile(null);
    fetchReports();
  }

  // 🔹 AI explanation from FILE only (no text input)
  async function handleExplainReport() {
    if (!aiFile) {
      alert("Please upload a report file for AI to explain.");
      return;
    }

    const formData = new FormData();
    formData.append("file", aiFile);

    const res = await fetch(`${API_BASE}/ai/report-explain-file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error explaining report");
      return;
    }
    setReportExplanation(data.explanation);
  }

  async function handleDoctorSuggest() {
    const res = await fetch(`${API_BASE}/ai/doctor-suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mainIssue: doctorIssue, city: doctorCity }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error suggesting doctor");
      return;
    }
    setDoctorSuggestion(data);
  }

  async function handleRemedySuggest() {
    const res = await fetch(`${API_BASE}/ai/remedy-suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symptom: remedySymptom, cyclePhase: remedyPhase }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error fetching remedies");
      return;
    }
    setRemedyResult(data);
  }

  async function handleApptSubmit(e) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(apptForm),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error saving appointment");
      return;
    }
    setApptForm({ doctorName: "", specialty: "", location: "", dateTime: "" });
    fetchNextAppt();
    alert("Appointment saved!");
  }

  // base URL for viewing files (since backend serves /uploads from 4000)
  const FILE_BASE = "http://localhost:4000";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Next appointment banner */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          fontSize: 14,
        }}
      >
        <strong>Next appointment: </strong>
        {nextAppt ? (
          <>
            {nextAppt.doctorName} on{" "}
            {new Date(nextAppt.dateTime).toLocaleString()} (
            {nextAppt.specialty || "Doctor"})
          </>
        ) : (
          "No upcoming appointment saved."
        )}
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Remember: this app cannot replace a doctor. Always follow medical
          advice.
        </div>
      </div>

      {/* 1. Upload / save medical reports (with file) */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3>Medical reports</h3>
        <form
          onSubmit={handleReportSubmit}
          style={{ display: "grid", gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Report title (e.g. Blood Test Jan 2025)"
            value={reportForm.title}
            onChange={(e) =>
              setReportForm({ ...reportForm, title: e.target.value })
            }
          />
          <input
            type="date"
            value={reportForm.date}
            onChange={(e) =>
              setReportForm({ ...reportForm, date: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Doctor name"
            value={reportForm.doctorName}
            onChange={(e) =>
              setReportForm({ ...reportForm, doctorName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Hospital/clinic"
            value={reportForm.hospital}
            onChange={(e) =>
              setReportForm({ ...reportForm, hospital: e.target.value })
            }
          />
          <textarea
            rows={3}
            placeholder="Notes / what doctor said (optional)"
            value={reportForm.notes}
            onChange={(e) =>
              setReportForm({ ...reportForm, notes: e.target.value })
            }
          />
          {/* 🔹 File input for the actual report */}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => setReportFile(e.target.files[0] || null)}
          />
          <button
            type="submit"
            disabled={!reportForm.title || !reportForm.date || !reportFile}
          >
            Save report
          </button>
        </form>

        <div>
          <h4>Saved reports</h4>
          {reports.length === 0 && (
            <p style={{ fontSize: 13 }}>No reports saved yet.</p>
          )}
          {reports.map((r) => (
            <div
              key={r._id}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                marginBottom: 8,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {new Date(r.date).toLocaleDateString()}{" "}
                {r.doctorName && `· Dr. ${r.doctorName}`}
              </div>
              {r.hospital && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {r.hospital}
                </div>
              )}
              {r.notes && <div style={{ marginTop: 4 }}>{r.notes}</div>}
              {/* 🔹 Link to view file if backend returns filePath */}
              {r.filePath && (
                <div style={{ marginTop: 4 }}>
                  <a
                    href={`${FILE_BASE}${r.filePath}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "#2563eb" }}
                  >
                    View report file
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Understand report (AI explanation via FILE) */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3>Understand your report (AI explanation)</h3>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Upload a medical report file (PDF, image, or document). The AI will
          try to explain it in simple language, but{" "}
          <strong>cannot diagnose</strong>.
        </p>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setAiFile(e.target.files[0] || null)}
          style={{ marginBottom: 8 }}
        />

        <button onClick={handleExplainReport} disabled={!aiFile}>
          Explain my report
        </button>

        {reportExplanation && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              background: "white",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            {reportExplanation}
          </pre>
        )}
      </section>

      {/* 3. Doctor suggestions */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3>Find the right type of doctor</h3>
        <input
          type="text"
          placeholder="Describe your main issue (e.g. heavy periods, PCOS, anxiety)"
          value={doctorIssue}
          onChange={(e) => setDoctorIssue(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="text"
          placeholder="Your city (optional)"
          value={doctorCity}
          onChange={(e) => setDoctorCity(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button onClick={handleDoctorSuggest} disabled={!doctorIssue.trim()}>
          Suggest doctor type
        </button>
        {doctorSuggestion && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              background: "white",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            <div>
              <strong>Suggested specialty:</strong> {doctorSuggestion.specialty}
            </div>
            <p style={{ marginTop: 4 }}>{doctorSuggestion.message}</p>
          </div>
        )}
      </section>

      {/* 4. Natural remedies with caution */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3>Comfort suggestions (not a cure)</h3>
        <input
          type="text"
          placeholder="Symptom (e.g. cramps, bloating, low mood)"
          value={remedySymptom}
          onChange={(e) => setRemedySymptom(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <select
          value={remedyPhase}
          onChange={(e) => setRemedyPhase(e.target.value)}
          style={{ marginBottom: 8 }}
        >
          <option value="period">On period</option>
          <option value="follicular">Follicular phase</option>
          <option value="ovulation">Ovulation</option>
          <option value="luteal">Luteal (PMS)</option>
        </select>
        <button onClick={handleRemedySuggest} disabled={!remedySymptom.trim()}>
          Get comfort tips
        </button>
        {remedyResult && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              background: "white",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            <ul>
              {remedyResult.tips?.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <p style={{ fontSize: 12, color: "#b91c1c" }}>
              {remedyResult.warning}
            </p>
          </div>
        )}
      </section>

      {/* 5. Schedule next appointment */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3>Schedule your next appointment</h3>
        <form onSubmit={handleApptSubmit} style={{ display: "grid", gap: 8 }}>
          <input
            type="text"
            placeholder="Doctor name"
            value={apptForm.doctorName}
            onChange={(e) =>
              setApptForm({ ...apptForm, doctorName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Specialty (e.g. Gynecologist)"
            value={apptForm.specialty}
            onChange={(e) =>
              setApptForm({ ...apptForm, specialty: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Location / hospital"
            value={apptForm.location}
            onChange={(e) =>
              setApptForm({ ...apptForm, location: e.target.value })
            }
          />
          <input
            type="datetime-local"
            value={apptForm.dateTime}
            onChange={(e) =>
              setApptForm({ ...apptForm, dateTime: e.target.value })
            }
          />
          <button type="submit">Save appointment</button>
        </form>
      </section>
    </div>
  );
}

export default WellnessPage;
