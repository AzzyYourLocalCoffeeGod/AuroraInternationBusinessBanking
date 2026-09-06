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
  Landmark,
  ArrowDownToLine,
  ArrowRightLeft,
  RefreshCw,
  RotateCcw,
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
  teal: "#5B9C89",
  danger: "#C1666B",
  success: "#6FA37A",
};

const FONT_SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';
const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const FONT_MONO = 'ui-monospace, "SF Mono", "IBM Plex Mono", Menlo, monospace';

// Fallback rates used until (or unless) the live API call below succeeds.
// Each value means "1 unit of this currency = this many CAD".
const DEFAULT_FX_TO_CAD = { CAD: 1, USD: 1.37, CNY: 0.192, JPY: 0.0094, DOP: 0.023 };

// Free, no-API-key exchange rate endpoint. Good enough for a demo;
// swap for a paid provider (or your payment rail's own FX quote)
// before this touches anything real, since free tiers can be rate
// limited or occasionally miss a currency.
const FX_API_URL = "https://open.er-api.com/v6/latest/CAD";

const CURRENCY_LABEL = {
  CAD: "Canadian dollar",
  USD: "US dollar",
  CNY: "Chinese yuan",
  JPY: "Japanese yen",
  DOP: "Dominican peso",
};

const INITIAL_HUB_BALANCES = { CAD: 128450, USD: 42310, CNY: 15200, JPY: 980000, DOP: 0 };

const INITIAL_ACCOUNTS = [
  { id: "cad", country: "Canada", currency: "CAD", bank: "TD Canada Trust", masked: "•••• 4471", bankBalance: 50000, startingBalance: 50000 },
  { id: "usd", country: "United States", currency: "USD", bank: "Chase", masked: "•••• 8890", bankBalance: 30000, startingBalance: 30000 },
  { id: "cny", country: "China", currency: "CNY", bank: "Bank of China", masked: "•••• 2214", bankBalance: 20000, startingBalance: 20000 },
  { id: "jpy", country: "Japan", currency: "JPY", bank: "MUFG Bank", masked: "•••• 5502", bankBalance: 500000, startingBalance: 500000 },
  { id: "dop", country: "Dominican Republic", currency: "DOP", bank: "Banreservas", masked: "•••• 7739", bankBalance: 300000, startingBalance: 300000 },
];

const COUNTERPARTIES = [
  { name: "Northbound Freight Co.", country: "Canada", currency: "CAD" },
  { name: "Anchor Line Logistics", country: "United States", currency: "USD" },
  { name: "Pacific Textile Ltd", country: "China", currency: "CNY" },
  { name: "Tokyo Marine Supply", country: "Japan", currency: "JPY" },
  { name: "Flor de Tamboril", country: "Dominican Republic", currency: "DOP" },
];

const INITIAL_INVOICES = [
  { id: "INV-1042", counterparty: "Northbound Freight Co.", currency: "CAD", amount: 12400, status: "paid", compliance: "verified", due: "2026-08-20", direction: "payable" },
  { id: "INV-1043", counterparty: "Anchor Line Logistics", currency: "USD", amount: 8750, status: "sent", compliance: "verified", due: "2026-09-10", direction: "payable" },
  { id: "INV-1044", counterparty: "Pacific Textile Ltd", currency: "CNY", amount: 64000, status: "draft", compliance: "pending", due: "2026-09-15", direction: "payable" },
  { id: "INV-1045", counterparty: "Tokyo Marine Supply", currency: "JPY", amount: 1250000, status: "sent", compliance: "verified", due: "2026-09-05", direction: "payable" },
  { id: "INV-1046", counterparty: "Flor de Tamboril", currency: "DOP", amount: 180000, status: "draft", compliance: "pending", due: "2026-09-20", direction: "receivable" },
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

function StatusBadge({ status }) {
  const map = {
    draft: { label: "Draft", color: COLORS.textMuted, bg: "rgba(139,149,167,0.14)" },
    sent: { label: "Sent", color: COLORS.accent, bg: "rgba(201,161,90,0.14)" },
    paid: { label: "Paid", color: COLORS.success, bg: "rgba(111,163,122,0.14)" },
  };
  const s = map[status];
  return (
    <span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 4 }}>
      {s.label}
    </span>
  );
}

function DirectionTag({ direction }) {
  const payable = direction === "payable";
  return (
    <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: payable ? COLORS.danger : COLORS.success }}>
      {payable ? "We owe" : "Owed to us"}
    </span>
  );
}

function ComplianceMark({ status }) {
  const verified = status === "verified";
  const Icon = verified ? ShieldCheck : ShieldAlert;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT_SANS, fontSize: 12, color: verified ? COLORS.teal : COLORS.textMuted }}>
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
        display: "flex", alignItems: "center", gap: 7, background: "transparent", border: "none",
        borderBottom: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
        color: active ? COLORS.text : COLORS.textMuted, fontFamily: FONT_SANS, fontSize: 14,
        fontWeight: 500, padding: "10px 4px", cursor: "pointer",
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
  const [hubBalances, setHubBalances] = useState(INITIAL_HUB_BALANCES);
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ counterparty: COUNTERPARTIES[0].name, currency: COUNTERPARTIES[0].currency, amount: "", due: "", direction: "payable" });
  const [formError, setFormError] = useState("");
  const [depositingId, setDepositingId] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");

  const [fxRates, setFxRates] = useState(DEFAULT_FX_TO_CAD);
  const [fxStatus, setFxStatus] = useState("idle"); // idle | loading | live | error
  const [fxUpdatedAt, setFxUpdatedAt] = useState(null);

  const [exchangeFrom, setExchangeFrom] = useState("CAD");
  const [exchangeTo, setExchangeTo] = useState("USD");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchangeError, setExchangeError] = useState("");

  const currencies = Object.keys(hubBalances);
  const toCad = (amount, currency) => amount * fxRates[currency];
  const totalCad = currencies.reduce((sum, cur) => sum + toCad(hubBalances[cur], cur), 0);

  function addLog(text) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    setLog((prev) => [{ time: stamp, text }, ...prev]);
  }

  // Pulls live CAD-based rates from a public FX API and converts them
  // into the same "1 unit = X CAD" shape the rest of the app expects.
  // Currencies the API doesn't return (rare, but happens on free tiers)
  // fall back to their existing rate instead of breaking the app.
  async function fetchLiveRates() {
    setFxStatus("loading");
    try {
      const res = await fetch(FX_API_URL);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const nextRates = { ...fxRates, CAD: 1 };
      for (const cur of currencies) {
        if (cur !== "CAD" && data.rates && data.rates[cur]) {
          nextRates[cur] = 1 / data.rates[cur];
        }
      }
      setFxRates(nextRates);
      setFxStatus("live");
      setFxUpdatedAt(new Date().toLocaleTimeString());
      addLog("Live exchange rates refreshed");
    } catch (err) {
      setFxStatus("error");
    }
  }

  function applyBalanceChange(currency, amount, direction) {
    setHubBalances((prev) => ({
      ...prev,
      [currency]: direction === "payable" ? prev[currency] - amount : prev[currency] + amount,
    }));
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
          applyBalanceChange(inv.currency, inv.amount, inv.direction);
          addLog(
            inv.direction === "payable"
              ? `${inv.id} paid to ${inv.counterparty} — ${formatAmount(inv.amount, inv.currency)} ${inv.currency} debited from hub`
              : `${inv.id} received from ${inv.counterparty} — ${formatAmount(inv.amount, inv.currency)} ${inv.currency} credited to hub`
          );
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
      direction: form.direction,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    addLog(`${newInvoice.id} created for ${newInvoice.counterparty}`);
    setForm({ counterparty: COUNTERPARTIES[0].name, currency: COUNTERPARTIES[0].currency, amount: "", due: "", direction: "payable" });
    setFormError("");
    setShowForm(false);
  }

  function submitDeposit(account) {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      setDepositError("Enter an amount greater than zero.");
      return;
    }
    if (amt > account.bankBalance) {
      setDepositError("Amount exceeds the linked account's balance.");
      return;
    }
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, bankBalance: a.bankBalance - amt } : a)));
    setHubBalances((prev) => ({ ...prev, [account.currency]: prev[account.currency] + amt }));
    addLog(`Deposited ${formatAmount(amt, account.currency)} ${account.currency} from ${account.bank} (${account.country}) to hub`);
    setDepositingId(null);
    setDepositAmount("");
    setDepositError("");
  }

  // Demo-only convenience: tops a linked bank account back up to its
  // starting balance, so you can keep testing deposits without running
  // a real bank-linking flow every time. Remove before this goes anywhere real.
  function reloadAccount(account) {
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, bankBalance: a.startingBalance } : a)));
    addLog(`${account.bank} (${account.country}) demo balance reloaded to ${formatAmount(account.startingBalance, account.currency)} ${account.currency}`);
  }

  // Converts hub balance from one currency to another at the current
  // fxRates, via CAD as the common unit: amount -> CAD -> target currency.
  function submitExchange(e) {
    e.preventDefault();
    const amt = Number(exchangeAmount);
    if (!amt || amt <= 0) {
      setExchangeError("Enter an amount greater than zero.");
      return;
    }
    if (exchangeFrom === exchangeTo) {
      setExchangeError("Choose two different currencies.");
      return;
    }
    if (amt > hubBalances[exchangeFrom]) {
      setExchangeError("Amount exceeds the hub balance for that currency.");
      return;
    }
    const cadValue = amt * fxRates[exchangeFrom];
    const converted = cadValue / fxRates[exchangeTo];
    setHubBalances((prev) => ({
      ...prev,
      [exchangeFrom]: prev[exchangeFrom] - amt,
      [exchangeTo]: prev[exchangeTo] + converted,
    }));
    addLog(`Exchanged ${formatAmount(amt, exchangeFrom)} ${exchangeFrom} for ${formatAmount(converted, exchangeTo)} ${exchangeTo}`);
    setExchangeAmount("");
    setExchangeError("");
  }

  const inputStyle = { width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: FONT_SANS, fontSize: 13, padding: "8px 10px", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.textMuted, marginBottom: 5 };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_SANS, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden", maxWidth: 780, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 20 }}>Meridian</span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>DCH Imports</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500, padding: "8px 14px", cursor: "pointer" }}
        >
          <Plus size={15} />
          New invoice
        </button>
      </div>

      {/* Hub balance strip */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${currencies.length}, 1fr)`, borderBottom: `1px solid ${COLORS.border}` }}>
        {currencies.map((cur, i) => (
          <div key={cur} style={{ padding: "14px 16px", borderLeft: i === 0 ? "none" : `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{cur}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16 }}>{formatAmount(hubBalances[cur], cur)}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>≈ {formatAmount(toCad(hubBalances[cur], cur), "CAD")} CAD</div>
          </div>
        ))}
      </div>

      {/* Rate status bar */}
      <div style={{ padding: "8px 24px", fontSize: 12, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>
          Total hub position ≈ <span style={{ color: COLORS.text, fontFamily: FONT_MONO }}>{formatAmount(totalCad, "CAD")} CAD</span>
        </span>
        <button
          onClick={fetchLiveRates}
          disabled={fxStatus === "loading"}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textMuted, borderRadius: 4, fontSize: 11, padding: "4px 8px", cursor: "pointer" }}
        >
          <RefreshCw size={11} />
          {fxStatus === "loading" ? "Refreshing…" : fxStatus === "live" ? `Live rates · ${fxUpdatedAt}` : fxStatus === "error" ? "Refresh failed, using placeholders" : "Using placeholder rates"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 18, padding: "0 24px", borderBottom: `1px solid ${COLORS.border}` }}>
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutGrid} label="Overview" />
        <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")} icon={FileText} label="Invoices" />
        <TabButton active={tab === "accounts"} onClick={() => setTab("accounts")} icon={Landmark} label="Accounts" />
        <TabButton active={tab === "exchange"} onClick={() => setTab("exchange")} icon={ArrowRightLeft} label="Exchange" />
        <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={Activity} label="Audit log" />
      </div>

      {/* New invoice form */}
      {showForm && (
        <form onSubmit={submitInvoice} style={{ margin: "18px 24px 0", background: COLORS.panel, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: 15 }}>New invoice</span>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close" style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Counterparty</label>
              <select style={inputStyle} value={form.counterparty} onChange={(e) => handleCounterpartyChange(e.target.value)}>
                {COUNTERPARTIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.country})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Direction</label>
              <select style={inputStyle} value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}>
                <option value="payable">We owe them (payable)</option>
                <option value="receivable">They owe us (receivable)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <input style={inputStyle} value={`${form.currency} — ${CURRENCY_LABEL[form.currency]}`} disabled />
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input style={inputStyle} type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
            </div>
          </div>
          {formError && <div style={{ color: COLORS.danger, fontSize: 12, marginBottom: 10 }}>{formError}</div>}
          <button type="submit" style={{ background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontSize: 13, fontWeight: 500, padding: "8px 14px", cursor: "pointer" }}>
            Create draft invoice
          </button>
        </form>
      )}

      {/* Tab content */}
      <div style={{ padding: 24 }}>
        {tab === "overview" && (
          <div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>Recent activity</div>
            {log.slice(0, 6).map((entry, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i === log.slice(0, 6).length - 1 ? "none" : `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <span>{entry.text}</span>
                <span style={{ color: COLORS.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>{entry.time}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "invoices" && (
          <div>
            {invoices.map((inv) => (
              <div key={inv.id} style={{ display: "grid", gridTemplateColumns: "85px 1fr 100px 90px 80px 100px 90px", alignItems: "center", gap: 8, padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <span style={{ fontFamily: FONT_MONO, color: COLORS.textMuted }}>{inv.id}</span>
                <span>{inv.counterparty}</span>
                <span style={{ fontFamily: FONT_MONO, textAlign: "right" }}>{formatAmount(inv.amount, inv.currency)} {inv.currency}</span>
                <DirectionTag direction={inv.direction} />
                <StatusBadge status={inv.status} />
                <ComplianceMark status={inv.compliance} />
                {inv.status !== "paid" ? (
                  <button
                    onClick={() => advanceStatus(inv.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.text, borderRadius: 4, fontSize: 12, padding: "5px 8px", cursor: "pointer", justifySelf: "start" }}
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

        {tab === "accounts" && (
          <div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
              Linked bank accounts — deposit into the corporate hub balance for that currency.
            </div>
            {accounts.map((a) => (
              <div key={a.id} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "14px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 100px 110px 90px", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <div>
                    <div>{a.bank} <span style={{ color: COLORS.textMuted }}>{a.masked}</span></div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{a.country}</div>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{a.currency} account</span>
                  <span style={{ fontFamily: FONT_MONO, textAlign: "right" }}>{formatAmount(a.bankBalance, a.currency)}</span>
                  <button
                    onClick={() => { setDepositingId(depositingId === a.id ? null : a.id); setDepositAmount(""); setDepositError(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.text, borderRadius: 4, fontSize: 12, padding: "5px 8px", cursor: "pointer", justifySelf: "start" }}
                  >
                    <ArrowDownToLine size={12} />
                    Deposit
                  </button>
                  <button
                    onClick={() => reloadAccount(a)}
                    title="Demo only: top this account back up"
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textMuted, borderRadius: 4, fontSize: 12, padding: "5px 8px", cursor: "pointer", justifySelf: "start" }}
                  >
                    <RotateCcw size={12} />
                    Reload
                  </button>
                </div>
                {depositingId === a.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      style={{ ...inputStyle, width: 140 }}
                      type="number" min="0" step="0.01" placeholder={`Amount in ${a.currency}`}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <button
                      onClick={() => submitDeposit(a)}
                      style={{ background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 500, padding: "7px 12px", cursor: "pointer" }}
                    >
                      Confirm deposit
                    </button>
                    {depositError && <span style={{ color: COLORS.danger, fontSize: 12 }}>{depositError}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "exchange" && (
          <div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
              Convert hub balance between currencies at {fxStatus === "live" ? "live" : "placeholder"} rates.
            </div>
            <form onSubmit={submitExchange} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>From</label>
                <select style={inputStyle} value={exchangeFrom} onChange={(e) => setExchangeFrom(e.target.value)}>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>To</label>
                <select style={inputStyle} value={exchangeTo} onChange={(e) => setExchangeTo(e.target.value)}>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Amount</label>
                <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} />
              </div>
              <button type="submit" style={{ background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontSize: 13, fontWeight: 500, padding: "8px 14px", cursor: "pointer", height: 36 }}>
                Convert
              </button>
            </form>
            {exchangeError && <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 10 }}>{exchangeError}</div>}
            {exchangeAmount && !exchangeError && exchangeFrom !== exchangeTo && (
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 10 }}>
                ≈ {formatAmount((Number(exchangeAmount) * fxRates[exchangeFrom]) / fxRates[exchangeTo], exchangeTo)} {exchangeTo}
              </div>
            )}
          </div>
        )}

        {tab === "log" && (
          <div>
            {log.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i === log.length - 1 ? "none" : `1px solid ${COLORS.border}`, fontSize: 13 }}>
                <Clock size={13} style={{ marginTop: 2, color: COLORS.textMuted, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textMuted, minWidth: 130 }}>{entry.time}</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}