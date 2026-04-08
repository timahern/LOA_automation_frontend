import React, { useEffect, useState } from "react";

export default function ProjectDatesModal({
  open,
  initialStart = "",
  initialFinish = "",
  onCancel,
  onConfirm,
}) {
  const [start, setStart] = useState(initialStart);
  const [finish, setFinish] = useState(initialFinish);

  useEffect(() => {
    if (!open) return;
    setStart(initialStart || "");
    setFinish(initialFinish || "");
  }, [open, initialStart, initialFinish]);

  if (!open) return null;

  const isValid = start && finish && new Date(start) <= new Date(finish);

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h2 style={{ marginTop: 0, color: "#eef2f7" }}>Project Dates</h2>
        <p style={{ color: "#7d97b4", marginTop: 0, marginBottom: 16 }}>
          Required — these dates apply to every subcontract.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, color: "#eef2f7" }}>Projected Start Date</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, color: "#eef2f7" }}>Projected Finish Date</span>
            <input
              type="date"
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button
            disabled={!isValid}
            onClick={() => onConfirm({ project_start_date: start, project_finish_date: finish })}
            style={{ ...styles.primary, opacity: isValid ? 1 : 0.5, cursor: isValid ? "pointer" : "not-allowed" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1400,
    padding: 20,
  },
  modal: {
    width: "min(520px, 95vw)",
    background: "#1a2638",
    border: "1px solid #2e4060",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #2e4060",
    background: "#0f1923",
    color: "#eef2f7",
    fontSize: "0.95rem",
    width: "100%",
  },
  primary: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#4CAF50",
    color: "white",
    fontWeight: 600,
    fontSize: "1rem",
  },
};
