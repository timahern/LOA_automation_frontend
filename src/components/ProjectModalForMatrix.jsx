import React, { useMemo, useState, useEffect } from "react";
import '../App.css';

export default function ProcoreProjectModal({
  open,
  companiesAndProjects,
  onClose,
  onConfirm,
  loading = false,
  title = "Select Company & Project",
  confirmLabel = "Start Commitment Creation",
  showSubsCheck = true,
}) {
  const [companyId, setCompanyId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCompanyId("");
    setProjectId("");
    setConfirmed(false);
  }, [open]);

  const selectedCompany = useMemo(() => {
    if (!companiesAndProjects) return null;
    return companiesAndProjects.find(c => String(c.id) === String(companyId)) || null;
  }, [companiesAndProjects, companyId]);

  const projects = selectedCompany?.projects || [];

  const handleCompanyChange = (val) => { setCompanyId(val); setProjectId(""); setConfirmed(false); };
  const handleProjectChange = (val) => { setProjectId(val); setConfirmed(false); };

  const canStart = !!companyId && !!projectId && (!showSubsCheck || confirmed) && !loading;

  if (!open) return null;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 className="SelectCompanyAndProjectHeader" style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">✕</button>
        </div>

        <div style={styles.body}>
          <label className="above-company-project-dropdown" style={styles.label}>Company</label>
          <select
            value={companyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            style={styles.select}
            disabled={loading}
          >
            <option value="">-- Choose a company --</option>
            {(companiesAndProjects || []).map((c) => (
              <option key={c.id} value={String(c.id)}>{c.company_name}</option>
            ))}
          </select>

          <label className="above-company-project-dropdown" style={styles.label}>Project</label>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            style={styles.select}
            disabled={!companyId || loading}
          >
            <option value="">-- Choose a project --</option>
            {projects.map((p) => (
              <option key={p.project_id} value={String(p.project_id)}>
                {"(" + p.project_number + ") " + p.project_name}
              </option>
            ))}
          </select>

          {companyId && projectId && showSubsCheck && (
            <div style={{ marginTop: 12 }}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={loading}
                />
                <span className="have-added-subs" style={{ fontWeight: 600 }}>
                  HAVE YOU ADDED ALL SUBCONTRACTORS TO THE PROJECT?
                </span>
              </label>
              <div style={styles.hint}>
                This is necessary to ensure all commitments link correctly.
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.secondary} disabled={loading}>Cancel</button>
          <button
            onClick={() => onConfirm({ companyId, projectId })}
            style={{ ...styles.primary, opacity: canStart ? 1 : 0.5 }}
            disabled={!canStart}
          >
            {loading ? "Starting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 16,
  },
  modal: {
    width: "min(650px, 95vw)",
    background: "#1a2638",
    border: "1px solid #2e4060",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #2e4060",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  body: { padding: 16, display: "grid", gap: 10 },
  label: { fontWeight: 700, marginTop: 6, color: "#eef2f7" },
  select: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #2e4060",
    background: "#0f1923",
    color: "#eef2f7",
    fontSize: "0.95rem",
  },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center" },
  hint: { fontSize: 12, color: "#7d97b4", marginLeft: 24, marginTop: 6 },
  footer: {
    padding: 16,
    borderTop: "1px solid #2e4060",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2e4060",
    cursor: "pointer",
    background: "transparent",
    color: "#7d97b4",
  },
  primary: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#2196F3",
    color: "white",
    fontWeight: 600,
  },
};
