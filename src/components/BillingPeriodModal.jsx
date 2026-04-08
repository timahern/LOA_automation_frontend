import React, { useState, useEffect } from "react";

export default function BillingPeriodModal({
  open,
  billingPeriods,
  loading = false,
  onClose,
  onConfirm,
  title = "Select Billing Period",
}) {
  const [selectedPeriodId, setSelectedPeriodId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedPeriodId("");
  }, [open]);

  const canConfirm = !!selectedPeriodId && !loading;

  if (!open) return null;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, color: "#eef2f7" }}>{title}</h3>
          <button onClick={onClose} style={styles.xBtn} aria-label="Close">✕</button>
        </div>

        <div style={styles.body}>
          {loading ? (
            <div style={styles.loadingRow}>
              <div style={styles.spinner} />
              <span style={{ color: "#7d97b4" }}>Fetching billing periods…</span>
            </div>
          ) : (
            <>
              <label style={styles.label}>Billing Period</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="">-- Choose a billing period --</option>
                {(billingPeriods || []).map((p) => (
                  <option key={p.period_id} value={String(p.period_id)}>
                    {`${p.position}. ${p.month} ${p.year}`}
                  </option>
                ))}
              </select>

              {selectedPeriodId && (
                <div style={styles.hint}>
                  {(() => {
                    const p = billingPeriods?.find(
                      (bp) => String(bp.period_id) === String(selectedPeriodId)
                    );
                    if (!p) return null;
                    return `Period: ${p.start_date} → ${p.end_date}  |  Due: ${p.due_date}`;
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.secondary} disabled={loading}>Cancel</button>
          <button
            onClick={() => {
              const period = billingPeriods?.find(
                (bp) => String(bp.period_id) === String(selectedPeriodId)
              );
              if (period) onConfirm(period);
            }}
            style={{ ...styles.primary, opacity: canConfirm ? 1 : 0.5 }}
            disabled={!canConfirm}
          >
            Generate Matrix
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
    width: "min(550px, 95vw)",
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
  xBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
    color: "#7d97b4",
    fontWeight: "bold",
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
  hint: { fontSize: 12, color: "#7d97b4", marginTop: 4 },
  loadingRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0" },
  spinner: {
    width: 22,
    height: 22,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #2196F3",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
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
