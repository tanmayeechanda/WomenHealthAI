// frontend/src/components/WellnessPage.jsx
import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:4000/api";
const FILE_BASE = "http://localhost:4000";

function WellnessPage({ token }) {
  const [reports, setReports] = useState([]);
  const [reportForm, setReportForm] = useState({
    title: "",
    date: "",
    doctorName: "",
    hospital: "",
    notes: "",
  });
  const [reportFile, setReportFile] = useState(null);

  const [aiFile, setAiFile] = useState(null);
  const [reportExplanation, setReportExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [doctorIssue, setDoctorIssue] = useState("");
  const [doctorCity, setDoctorCity] = useState("");
  const [doctorSuggestion, setDoctorSuggestion] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const [remedySymptom, setRemedySymptom] = useState("");
  const [remedyPhase, setRemedyPhase] = useState("period");
  const [remedyResult, setRemedyResult] = useState(null);
  const [remedyLoading, setRemedyLoading] = useState(false);

  const [apptForm, setApptForm] = useState({
    doctorName: "",
    specialty: "",
    location: "",
    dateTime: "",
  });
  const [nextAppt, setNextAppt] = useState(null);
  const [apptLoading, setApptLoading] = useState(false);

  const [loadingReports, setLoadingReports] = useState(false);

  // report filters
  const [reportSearch, setReportSearch] = useState("");
  const [reportDoctorFilter, setReportDoctorFilter] = useState("");

  // symptom log state
  const [symptomForm, setSymptomForm] = useState({
    symptom: "",
    severity: 3,
    notes: "",
  });
  const [symptoms, setSymptoms] = useState([]);
  const [symptomLoading, setSymptomLoading] = useState(false);

  // current phase from period tracker
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState(null);
  const [phaseLoading, setPhaseLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingReports(true);
      const res = await fetch(`${API_BASE}/medical/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setReports(data);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  const fetchNextAppt = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/appointments/next`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setNextAppt(data);
  }, [token]);

  const fetchCurrentPhase = useCallback(async () => {
    if (!token) return;
    try {
      setPhaseLoading(true);
      const res = await fetch(`${API_BASE}/period/current-phase`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentPhaseInfo(data);
      if (data.phase && data.phase !== "unknown") {
        setRemedyPhase(data.phase);
      }
    } finally {
      setPhaseLoading(false);
    }
  }, [token]);

  const fetchSymptoms = useCallback(async () => {
    if (!token) return;
    try {
      setSymptomLoading(true);
      const res = await fetch(`${API_BASE}/symptoms/entries?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSymptoms(data);
    } finally {
      setSymptomLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchReports();
    fetchNextAppt();
    fetchCurrentPhase();
    fetchSymptoms();
  }, [token, fetchReports, fetchNextAppt, fetchCurrentPhase, fetchSymptoms]);

  // ---------- REPORT UPLOAD ----------
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
    formData.append("file", reportFile);

    const res = await fetch(`${API_BASE}/medical/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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

  // ---------- AI EXPLAIN ----------
  async function handleExplainReport() {
    if (!aiFile) {
      alert("Please upload a report file for AI to explain.");
      return;
    }

    const formData = new FormData();
    formData.append("file", aiFile);

    try {
      setAiLoading(true);
      setReportExplanation("");
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
    } finally {
      setAiLoading(false);
    }
  }

  // ---------- DOCTOR SUGGEST ----------
  async function handleDoctorSuggest() {
    try {
      setDoctorLoading(true);
      setDoctorSuggestion(null);

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
    } finally {
      setDoctorLoading(false);
    }
  }

  // ---------- REMEDY SUGGEST ----------
  async function handleRemedySuggest() {
    try {
      setRemedyLoading(true);
      setRemedyResult(null);

      const res = await fetch(`${API_BASE}/ai/remedy-suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom: remedySymptom,
          cyclePhase: remedyPhase,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error fetching comfort tips");
        return;
      }
      setRemedyResult(data);
    } finally {
      setRemedyLoading(false);
    }
  }

  // ---------- APPOINTMENT SUBMIT ----------
  async function handleApptSubmit(e) {
    e.preventDefault();
    try {
      setApptLoading(true);
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
      setApptForm({
        doctorName: "",
        specialty: "",
        location: "",
        dateTime: "",
      });
      fetchNextAppt();
      alert("Appointment saved! I’ll help you remember it 😊");
    } finally {
      setApptLoading(false);
    }
  }

  // ---------- SYMPTOM LOG ----------
  async function handleSymptomSubmit(e) {
    e.preventDefault();
    if (!symptomForm.symptom.trim()) {
      alert("Please describe the symptom.");
      return;
    }

    try {
      setSymptomLoading(true);
      const res = await fetch(`${API_BASE}/symptoms/entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...symptomForm,
          cyclePhase: currentPhaseInfo?.phase || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error logging symptom");
        return;
      }

      setSymptomForm({ symptom: "", severity: 3, notes: "" });
      fetchSymptoms();
    } finally {
      setSymptomLoading(false);
    }
  }

  // ---------- FILTER REPORTS ----------
  const filteredReports = reports.filter((r) => {
    const matchesDoctor = reportDoctorFilter
      ? r.doctorName?.toLowerCase() === reportDoctorFilter.toLowerCase()
      : true;

    const matchesSearch = reportSearch
      ? (r.title &&
          r.title.toLowerCase().includes(reportSearch.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(reportSearch.toLowerCase()))
      : true;

    return matchesDoctor && matchesSearch;
  });

  const totalReports = reports.length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* 0. Wellness snapshot */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background:
            "linear-gradient(135deg, rgba(219,234,254,0.9), rgba(255,228,230,0.9))",
          border: "1px solid #bfdbfe",
          fontSize: 14,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
          Today’s wellness snapshot
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>Next appointment: </strong>
          {nextAppt ? (
            <>
              {nextAppt.doctorName || "Your doctor"} on{" "}
              {new Date(nextAppt.dateTime).toLocaleString()}{" "}
              {nextAppt.specialty && `(${nextAppt.specialty})`}
            </>
          ) : (
            "You haven’t added a next appointment yet."
          )}
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>Saved reports: </strong>
          {totalReports === 0
            ? "No reports saved yet."
            : totalReports === 1
            ? "1 report"
            : `${totalReports} reports`}
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong>Cycle phase (approx): </strong>
          {phaseLoading
            ? "Checking your logs…"
            : currentPhaseInfo?.phase && currentPhaseInfo.phase !== "unknown"
            ? `${currentPhaseInfo.phase} phase`
            : "Not sure yet – you can log your periods in the Period Tracker."}
        </div>
        <div style={{ fontSize: 12, marginTop: 4, color: "#374151" }}>
          This space is here to help you feel organised and supported. It
          doesn’t replace a real doctor, but it can remind you that you’re
          taking care of yourself 💗
        </div>
      </div>

      {/* 1. Medical reports */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Medical reports</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          Keep your important reports in one place. You can store what it was
          about, which doctor you met, and any notes you want to remember.
        </p>

        <form
          onSubmit={handleReportSubmit}
          style={{ display: "grid", gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Report title (e.g. Blood Test – Jan 2025)"
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
            placeholder="Hospital / clinic"
            value={reportForm.hospital}
            onChange={(e) =>
              setReportForm({ ...reportForm, hospital: e.target.value })
            }
          />
          <textarea
            rows={3}
            placeholder="Notes / what the doctor explained (optional)"
            value={reportForm.notes}
            onChange={(e) =>
              setReportForm({ ...reportForm, notes: e.target.value })
            }
          />
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

        {/* Reports filter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search in reports (title / notes)…"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            style={{
              flex: "1 1 150px",
              padding: 6,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
            }}
          />
          <input
            type="text"
            placeholder="Filter by doctor name"
            value={reportDoctorFilter}
            onChange={(e) => setReportDoctorFilter(e.target.value)}
            style={{
              flex: "0 0 160px",
              padding: 6,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
            }}
          />
        </div>

        <div>
          <h4 style={{ marginBottom: 6 }}>Saved reports</h4>
          {loadingReports && (
            <p style={{ fontSize: 13, color: "#6b7280" }}>Loading reports…</p>
          )}
          {!loadingReports && filteredReports.length === 0 && (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              No reports match these filters yet.
            </p>
          )}
          {filteredReports.map((r) => (
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
                {r.date && new Date(r.date).toLocaleDateString()}{" "}
                {r.doctorName && `· Dr. ${r.doctorName}`}
              </div>
              {r.hospital && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {r.hospital}
                </div>
              )}
              {r.notes && (
                <div style={{ marginTop: 4, fontSize: 13 }}>{r.notes}</div>
              )}
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

      {/* 2. AI explanation */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Understand your report (AI explanation)
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          Upload a medical report file (PDF, image, or document). The AI will
          give you a gentle, general guide on how to read it. It{" "}
          <strong>cannot diagnose or replace your doctor</strong>.
        </p>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => setAiFile(e.target.files[0] || null)}
          style={{ marginBottom: 8 }}
        />

        <button onClick={handleExplainReport} disabled={!aiFile || aiLoading}>
          {aiLoading ? "Explaining…" : "Explain my report"}
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
        <h3 style={{ marginTop: 0 }}>Find the right type of doctor</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          Tell me what you’re mainly struggling with, and I’ll suggest{" "}
          <strong>which kind of specialist</strong> might be suitable to talk
          to. If you add your city, I’ll also give you quick search links to
          find top-rated doctors near you.
        </p>
        <input
          type="text"
          placeholder="Main issue (e.g. heavy periods, PCOS, anxiety, hair fall, fever)"
          value={doctorIssue}
          onChange={(e) => setDoctorIssue(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="text"
          placeholder="Your city (e.g. Hyderabad, Noida)"
          value={doctorCity}
          onChange={(e) => setDoctorCity(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button
          onClick={handleDoctorSuggest}
          disabled={!doctorIssue.trim() || doctorLoading}
        >
          {doctorLoading ? "Thinking…" : "Suggest doctor type & search links"}
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

            {doctorSuggestion.searchLinks && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  Where you can search for top-rated doctors:
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  {doctorSuggestion.searchLinks.googleSearchUrl && (
                    <a
                      href={doctorSuggestion.searchLinks.googleSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        textDecoration: "none",
                      }}
                    >
                      Google Search
                    </a>
                  )}
                  {doctorSuggestion.searchLinks.googleMapsUrl && (
                    <a
                      href={doctorSuggestion.searchLinks.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        textDecoration: "none",
                      }}
                    >
                      Google Maps
                    </a>
                  )}
                  {doctorSuggestion.searchLinks.practoSearchUrl && (
                    <a
                      href={doctorSuggestion.searchLinks.practoSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        textDecoration: "none",
                      }}
                    >
                      Practo
                    </a>
                  )}
                </div>
                {doctorSuggestion.note && (
                  <p style={{ fontSize: 11, color: "#6b7280" }}>
                    {doctorSuggestion.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Comfort suggestions (non-medical), auto phase */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Comfort suggestions (not a cure)</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          These are gentle ideas to make you a bit more comfortable (like rest,
          warmth, hydration). They are <strong>not treatment</strong> – always
          follow medical advice.
        </p>
        <input
          type="text"
          placeholder="Symptom (e.g. cramps, bloating, low mood, fatigue)"
          value={remedySymptom}
          onChange={(e) => setRemedySymptom(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
          Phase (auto-picked from your period logs, but you can change it):
        </div>
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
        <button
          onClick={handleRemedySuggest}
          disabled={!remedySymptom.trim() || remedyLoading}
        >
          {remedyLoading ? "Gathering tips…" : "Get comfort tips"}
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
            {remedyResult.warning && (
              <p style={{ fontSize: 12, color: "#b91c1c" }}>
                {remedyResult.warning}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 5. Symptom log section */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Symptom log</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          A small place to track things like cramps, headaches, mood changes,
          etc. This stays here so you can remember what you’ve been feeling over
          days or weeks.
        </p>

        <form
          onSubmit={handleSymptomSubmit}
          style={{ display: "grid", gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Symptom (e.g. cramps, headache, low energy)"
            value={symptomForm.symptom}
            onChange={(e) =>
              setSymptomForm({ ...symptomForm, symptom: e.target.value })
            }
          />
          <label style={{ fontSize: 13 }}>
            Severity (1 = very mild, 5 = very strong):
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={symptomForm.severity}
            onChange={(e) =>
              setSymptomForm({
                ...symptomForm,
                severity: Number(e.target.value),
              })
            }
          />
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Current: {symptomForm.severity}/5
          </div>
          <textarea
            rows={2}
            placeholder="Extra notes (e.g. when it started, what helped, any triggers)"
            value={symptomForm.notes}
            onChange={(e) =>
              setSymptomForm({ ...symptomForm, notes: e.target.value })
            }
          />
          <button type="submit" disabled={symptomLoading}>
            {symptomLoading ? "Saving…" : "Save symptom"}
          </button>
        </form>

        <h4 style={{ marginBottom: 6 }}>Recent symptoms</h4>
        {symptomLoading && symptoms.length === 0 && (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Loading your symptom history…
          </p>
        )}
        {!symptomLoading && symptoms.length === 0 && (
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Nothing logged yet. You can start whenever you feel like tracking
            what your body is telling you.
          </p>
        )}
        {symptoms.map((s) => (
          <div
            key={s._id}
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              marginBottom: 6,
              background: "white",
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {new Date(s.dateTime || s.createdAt).toLocaleString()}{" "}
              {s.cyclePhase && `· ${s.cyclePhase} phase`}
            </div>
            <div style={{ fontWeight: 600 }}>
              {s.symptom} (severity {s.severity}/5)
            </div>
            {s.notes && <div style={{ marginTop: 2 }}>{s.notes}</div>}
          </div>
        ))}
      </section>

      {/* 6. Schedule next appointment */}
      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Schedule your next appointment</h3>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
          Add your upcoming doctor visit so you don’t have to keep everything in
          your head.
        </p>
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
          <button type="submit" disabled={apptLoading}>
            {apptLoading ? "Saving…" : "Save appointment"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default WellnessPage;
