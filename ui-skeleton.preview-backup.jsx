import { useState } from "react";
import {
  Plus,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  X,
  FileText,
  Activity,
  LayoutGrid,
} from "lucide-react";

const COLORS = {
  bg: "#101B2D",
  panel: "#16233A",
  panelRaised: "#1D2E4A",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#EDEAE0",
  textMuted: "#8B95A7",
  accent: "#C9A15A",
  accentDark: "#8A6B39",
  teal: "#5B9C89",
  danger: "#C1666B",
  success: "#6FA37A",
};

const FONT_SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';
const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const FONT_MONO =
  'ui-monospace, "SF Mono", "IBM Plex Mono", Menlo, monospace';

const FX_TO_CAD = { CAD: 1, USD: 1.37, CNY: 0.192, JPY: 0.0094 };

const CURRENCY_LABEL = {
  CAD: "Canadian dollar",
  USD: "US dollar",
  CNY: "Chinese yuan",
  JPY: "Japanese yen",
};

const BALANCES = [
  { currency: "CAD", amount: 128450.0 },
  { currency: "USD", amount: 42310.0 },
  { currency: "CNY", amount: 15200.0 },
  { currency: "JPY", amount: 980000.0 },
];

const COUNTERPARTIES = [
  { name: "Northbound Freight Co.", country: "Canada", currency: "CAD" },
  { name: "Anchor Line Logistics", country: "United States", currency: "USD" },
  { name: "Pacific Textile Ltd", country: "China", currency: "CNY" },
  { name: "Tokyo Marine Supply", country: "Japan", currency: "JPY" },
];

const INITIAL_INVOICES = [
  {
    id: "INV-1042",
    counterparty: "Northbound Freight Co.",
    currency: "CAD",
    amount: 12400,
    status: "paid",
    compliance: "verified",
    due: "2026-08-20",
  },
  {
    id: "INV-1043",
    counterparty: "Anchor Line Logistics",
    currency: "USD",
    amount: 8750,
    status: "sent",
    compliance: "verified",
    due: "2026-09-10",
  },
  {
    id: "INV-1044",
    counterparty: "Pacific Textile Ltd",
    currency: "CNY",
    amount: 64000,
    status: "draft",
    compliance: "pending",
    due: "2026-09-15",
  },
  {
    id: "INV-1045",
    counterparty: "Tokyo Marine Supply",
    currency: "JPY",
    amount: 1250000,
    status: "sent",
    compliance: "verified",
    due: "2026-09-05",
  },
  {
    id: "INV-1046",
    counterparty: "Northbound Freight Co.",
    currency: "CAD",
    amount: 5200,
    status: "draft",
    compliance: "pending",
    due: "2026-09-20",
  },
];

const INITIAL_LOG = [
  { time: "2026-08-20 09:14", text: "INV-1042 marked paid by DCH Imports" },
  { time: "2026-09-01 11:02", text: "INV-1043 sent to Anchor Line Logistics" },
  { time: "2026-09-02 16:40", text: "INV-1045 sent to Tokyo Marine Supply" },
];

function formatAmount(amount, currency) {
  const decimals = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

function toCad(amount, currency) {
  return amount * FX_TO_CAD[currency];
}

function StatusBadge({ status }) {
  const map = {
    draft: { label: "Draft", color: COLORS.textMuted, bg: "rgba(139,149,167,0.14)" },
    sent: { label: "Sent", color: COLORS.accent, bg: "rgba(201,161,90,0.14)" },
    paid: { label: "Paid", color: COLORS.success, bg: "rgba(111,163,122,0.14)" },
  };
  const s = map[status];
  return (
    <span
      style={{
        fontFamily: FONT_SANS,
        fontSize: 12,
        fontWeight: 500,
        color: s.color,
        background: s.bg,
        padding: "3px 9px",
        borderRadius: 4,
        letterSpacing: 0.2,
      }}
    >
      {s.label}
    </span>
  );
}

function ComplianceMark({ status }) {
  const verified = status === "verified";
  const Icon = verified ? ShieldCheck : ShieldAlert;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: FONT_SANS,
        fontSize: 12,
        color: verified ? COLORS.teal : COLORS.textMuted,
      }}
    >
      <Icon size={14} />
      {verified ? "Verified" : "Pending KYC"}
    </span>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
        color: active ? COLORS.text : COLORS.textMuted,
        fontFamily: FONT_SANS,
        fontSize: 14,
        fontWeight: 500,
        padding: "10px 4px",
        cursor: "pointer",
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function MeridianDashboard() {
  const [tab, setTab] = useState("overview");
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [log, setLog] = useState(INITIAL_LOG);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    counterparty: COUNTERPARTIES[0].name,
    currency: COUNTERPARTIES[0].currency,
    amount: "",
    due: "",
  });
  const [formError, setFormError] = useState("");

  const totalCad = BALANCES.reduce((sum, b) => sum + toCad(b.amount, b.currency), 0);

  function addLog(text) {
    const now = new Date();
    const stamp = now.toISOString().slice(0, 16).replace("T", " ");
    setLog((prev) => [{ time: stamp, text }, ...prev]);
  }

  function advanceStatus(id) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        if (inv.status === "draft") {
          addLog(`${inv.id} sent to ${inv.counterparty}`);
          return { ...inv, status: "sent" };
        }
        if (inv.status === "sent") {
          addLog(`${inv.id} marked paid by DCH Imports`);
          return { ...inv, status: "paid", compliance: "verified" };
        }
        return inv;
      })
    );
  }

  function handleCounterpartyChange(name) {
    const cp = COUNTERPARTIES.find((c) => c.name === name);
    setForm((f) => ({ ...f, counterparty: name, currency: cp.currency }));
  }

  function submitInvoice(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (!form.due) {
      setFormError("Choose a due date.");
      return;
    }
    const nextNum = 1046 + invoices.filter((i) => i.id.startsWith("INV-1")).length + 1;
    const newInvoice = {
      id: `INV-${nextNum}`,
      counterparty: form.counterparty,
      currency: form.currency,
      amount: Number(form.amount),
      status: "draft",
      compliance: "pending",
      due: form.due,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    addLog(`${newInvoice.id} created for ${newInvoice.counterparty}`);
    setForm({ counterparty: COUNTERPARTIES[0].name, currency: COUNTERPARTIES[0].currency, amount: "", due: "" });
    setFormError("");
    setShowForm(false);
  }

  const inputStyle = {
    width: "100%",
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    color: COLORS.text,
    fontFamily: FONT_SANS,
    fontSize: 13,
    padding: "8px 10px",
    boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block",
    fontFamily: FONT_SANS,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 5,
  };

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: FONT_SANS,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 20, letterSpacing: 0.3 }}>
            Meridian
          </span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>DCH Imports</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: COLORS.accent,
            color: "#1D1707",
            border: "none",
            borderRadius: 5,
            fontFamily: FONT_SANS,
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          New invoice
        </button>
      </div>

      {/* Balance ledger strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {BALANCES.map((b, i) => (
          <div
            key={b.currency}
            style={{
              padding: "14px 16px",
              borderLeft: i === 0 ? "none" : `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>
              {b.currency}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16 }}>
              {formatAmount(b.amount, b.currency)}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              ≈ {formatAmount(toCad(b.amount, b.currency), "CAD")} CAD
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: "10px 24px",
          fontSize: 12,
          color: COLORS.textMuted,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        Total position ≈{" "}
        <span style={{ color: COLORS.text, fontFamily: FONT_MONO }}>
          {formatAmount(totalCad, "CAD")} CAD
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 18,
          padding: "0 24px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutGrid} label="Overview" />
        <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")} icon={FileText} label="Invoices" />
        <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={Activity} label="Audit log" />
      </div>

      {/* New invoice form (in-flow, not a fixed overlay) */}
      {showForm && (
        <form
          onSubmit={submitInvoice}
          style={{
            margin: "18px 24px 0",
            background: COLORS.panel,
            border: `1px solid ${COLORS.borderStrong}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 15 }}>New invoice</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close"
              style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Counterparty</label>
              <select
                style={inputStyle}
                value={form.counterparty}
                onChange={(e) => handleCounterpartyChange(e.target.value)}
              >
                {COUNTERPARTIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <input style={inputStyle} value={`${form.currency} — ${CURRENCY_LABEL[form.currency]}`} disabled />
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input
                style={inputStyle}
                type="date"
                value={form.due}
                onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
              />
            </div>
          </div>
          {formError && (
            <div style={{ color: COLORS.danger, fontSize: 12, marginBottom: 10 }}>{formError}</div>
          )}
          <button
            type="submit"
            style={{
              background: COLORS.accent,
              color: "#1D1707",
              border: "none",
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 500,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Create draft invoice
          </button>
        </form>
      )}

      {/* Tab content */}
      <div style={{ padding: 24 }}>
        {tab === "overview" && (
          <div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>
              Recent activity
            </div>
            {log.slice(0, 6).map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: i === log.slice(0, 6).length - 1 ? "none" : `1px solid ${COLORS.border}`,
                  fontSize: 13,
                }}
              >
                <span>{entry.text}</span>
                <span style={{ color: COLORS.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "invoices" && (
          <div>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 110px 90px 110px 90px",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: `1px solid ${COLORS.border}`,
                  fontSize: 13,
                }}
              >
                <span style={{ fontFamily: FONT_MONO, color: COLORS.textMuted }}>{inv.id}</span>
                <span>{inv.counterparty}</span>
                <span style={{ fontFamily: FONT_MONO, textAlign: "right" }}>
                  {formatAmount(inv.amount, inv.currency)} {inv.currency}
                </span>
                <StatusBadge status={inv.status} />
                <ComplianceMark status={inv.compliance} />
                {inv.status !== "paid" ? (
                  <button
                    onClick={() => advanceStatus(inv.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "transparent",
                      border: `1px solid ${COLORS.borderStrong}`,
                      color: COLORS.text,
                      borderRadius: 4,
                      fontSize: 12,
                      padding: "5px 8px",
                      cursor: "pointer",
                      justifySelf: "start",
                    }}
                  >
                    {inv.status === "draft" ? <Send size={12} /> : <CheckCircle2 size={12} />}
                    {inv.status === "draft" ? "Send" : "Mark paid"}
                  </button>
                ) : (
                  <span style={{ color: COLORS.success, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={12} /> Done
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "log" && (
          <div>
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: i === log.length - 1 ? "none" : `1px solid ${COLORS.border}`,
                  fontSize: 13,
                }}
              >
                <Clock size={13} style={{ marginTop: 2, color: COLORS.textMuted, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textMuted, minWidth: 130 }}>
                  {entry.time}
                </span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}