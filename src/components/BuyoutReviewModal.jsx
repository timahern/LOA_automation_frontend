import React, { useEffect, useMemo, useState } from "react";

export default function BuyoutReviewModal({
  open,
  croppedBuyoutDataUrl,
  sub,
  index = 0,
  total = 0,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [draft, setDraft] = useState(null);
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(sub ? { ...sub } : null);
    setTouched(false);
  }, [open, sub]);

  useEffect(() => {
    if (!open) return;
    setConfirming(false);
  }, [open, sub]);

  const missing = useMemo(() => {
    if (!draft) return ["No data"];
    const req = [];
    if (!draft.vendor_selected) req.push("Vendor selected");
    if (!draft.cost_code) req.push("Cost code");
    if (!draft.subcontract_amount) req.push("Subcontract amount");
    return req;
  }, [draft]);

  const canConfirm = open && !!draft && missing.length === 0 && !loading && !confirming;

  if (!open) return null;

  const setField = (key, value) => {
    setTouched(true);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeAmount = (val) => {
    if (val === "") return "";
    const cleaned = String(val).replace(/[$,]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : val;
  };

  return (
    <div style={styles.backdrop} onMouseDown={() => !loading && onClose?.()}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h3 style={{ color: "#eef2f7", fontWeight: "bold", fontSize: "1.6rem", margin: 0 }}>
              Review Buyout Data
            </h3>
            <div style={{ color: "#7d97b4", fontSize: 15, marginTop: 4 }}>
              {total ? `Sub ${index + 1} of ${total}` : ""}
            </div>
          </div>
          <button
            onClick={() => !loading && onClose?.()}
            style={{ ...styles.xBtn, opacity: loading ? 0.5 : 1 }}
            aria-label="Close"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={styles.body}>
          {/* LEFT: Image */}
          <div style={styles.leftPane}>
            {croppedBuyoutDataUrl ? (
              <img src={croppedBuyoutDataUrl} alt="Cropped Buyout Page" style={styles.image} />
            ) : (
              <div style={styles.imagePlaceholder}>No buyout preview available.</div>
            )}
          </div>

          {/* RIGHT: Fields */}
          <div style={styles.rightPane}>
            <Field label="Vendor Selected *" value={draft?.vendor_selected ?? ""} onChange={(v) => setField("vendor_selected", v)} disabled={loading} placeholder="e.g., Apex Electrical" />
            <Field label="Trade" value={draft?.trade ?? ""} onChange={(v) => setField("trade", v)} disabled={loading} placeholder="e.g., Electrical" />
            <Field label="Cost Code *" value={draft?.cost_code ?? ""} onChange={(v) => setField("cost_code", v)} disabled={loading} placeholder="e.g., 16-100" />
            <Field
              label="Subcontract Amount *"
              value={draft?.subcontract_amount === null || typeof draft?.subcontract_amount === "undefined" ? "" : String(draft.subcontract_amount)}
              onChange={(v) => setField("subcontract_amount", normalizeAmount(v))}
              disabled={loading}
              placeholder="e.g., 125000"
              inputMode="decimal"
            />

            {missing.length > 0 && (
              <div style={styles.warning}>Missing required: {missing.join(", ")}</div>
            )}

            {touched && (
              <div style={{ fontSize: 12, color: "#7d97b4", marginTop: 8 }}>Unsaved changes.</div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => !loading && onClose?.()}
              style={styles.secondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!draft || confirming || loading) return;
                setConfirming(true);
                onConfirm?.(draft);
              }}
              style={{ ...styles.primary, opacity: canConfirm ? 1 : 0.5 }}
              disabled={!canConfirm}
            >
              {loading ? "Saving..." : confirming ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder, inputMode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={styles.label}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        style={{ ...styles.input, opacity: disabled ? 0.65 : 1 }}
      />
    </div>
  );
}

const styles = {
  label: { fontWeight: 700, color: "#eef2f7", fontSize: 13 },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #2e4060",
    fontSize: 14,
    color: "#eef2f7",
    background: "#0f1923",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    padding: 16,
  },
  modal: {
    width: "min(900px, 92vw)",
    maxHeight: "88vh",
    background: "#1a2638",
    border: "1px solid #2e4060",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "14px 18px",
    borderBottom: "1px solid #2e4060",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  xBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
    color: "#7d97b4",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 14,
    padding: 16,
    overflow: "auto",
  },
  leftPane: {
    border: "1px solid #2e4060",
    borderRadius: 10,
    padding: 10,
    background: "#0f1923",
    minHeight: 420,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rightPane: {
    display: "grid",
    gap: 12,
    alignContent: "start",
    maxWidth: 360,
    width: "100%",
    justifySelf: "end",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "70vh",
    height: "auto",
    borderRadius: 8,
    display: "block",
    objectFit: "contain",
  },
  imagePlaceholder: { padding: 20, textAlign: "center", color: "#7d97b4" },
  warning: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    background: "rgba(201, 162, 39, 0.15)",
    border: "1px solid rgba(201, 162, 39, 0.4)",
    color: "#c9a227",
    fontSize: 13,
  },
  footer: {
    padding: 16,
    borderTop: "1px solid #2e4060",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    background: "#4CAF50",
    color: "white",
    fontWeight: 700,
  },
};
