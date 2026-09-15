import { useEffect, useState } from "react";
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
  BarChart3,
  PieChart,
  Search,
  CandlestickChart,
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
  { time: "2026-08-20 09:14", text: "INV-1042 marked paid by The Cedar Tree Company Inc." },
  { time: "2026-09-01 11:02", text: "INV-1043 sent to Anchor Line Logistics" },
  { time: "2026-09-02 16:40", text: "INV-1045 sent to Tokyo Marine Supply" },
];

const INITIAL_INVESTMENT_ACCOUNTS = [
  { id: "tfsa", name: "TFSA", description: "Tax-free savings account", room: "", contributed: "" },
  { id: "rrsp", name: "RRSP", description: "Registered retirement savings plan", room: "", contributed: "" },
  { id: "fhsa", name: "FHSA", description: "First home savings account", room: "", contributed: "" },
  { id: "nonRegistered", name: "Non-registered", description: "Personal taxable investment account", room: "", contributed: "" },
];

const INITIAL_HOLDINGS = [
  { account: "tfsa", ticker: "EIT.UN", shares: 5, description: "ETF" },
  { account: "tfsa", ticker: "PYF", shares: 3, description: "ETF" },
  { account: "rrsp", ticker: "Ford", shares: 2.0214, description: "Equity" },
  { account: "rrsp", ticker: "GM", shares: 0.0651, description: "Equity" },
  { account: "rrsp", ticker: "JEPI", shares: 2.0253, description: "ETF" },
  { account: "rrsp", ticker: "JEPQ", shares: 0.0343, description: "ETF" },
  { account: "rrsp", ticker: "KO", shares: 0.076, description: "Equity" },
  { account: "rrsp", ticker: "PEP", shares: 0.0448, description: "Equity" },
  { account: "rrsp", ticker: "PLUG", shares: 9, description: "Equity" },
  { account: "rrsp", ticker: "SPYI", shares: 0.0439, description: "ETF" },
];

const MARKET_OPTIONS = [
  { id: "canada", label: "Canada", currency: "CAD" },
  { id: "unitedStates", label: "United States", currency: "USD" },
  { id: "japan", label: "Japan", currency: "JPY" },
  { id: "china", label: "China", currency: "CNY" },
];

const MARKET_INSTRUMENTS = [
  { market: "canada", ticker: "EIT.UN", name: "Canoe EIT Income Fund", type: "ETF", price: 13.42, dividendYield: 8.11, annualDividend: 1.088 },
  { market: "canada", ticker: "PYF", name: "PenderFund Monthly Income", type: "ETF", price: 11.78, dividendYield: 6.52, annualDividend: 0.768 },
  { market: "canada", ticker: "RY", name: "Royal Bank of Canada", type: "Equity", price: 184.62, dividendYield: 3.74, annualDividend: 6.90 },
  { market: "unitedStates", ticker: "Ford", name: "Ford Motor Co.", type: "Equity", price: 11.24, dividendYield: 6.41, annualDividend: 0.72 },
  { market: "unitedStates", ticker: "GM", name: "General Motors Co.", type: "Equity", price: 49.86, dividendYield: 0.80, annualDividend: 0.40 },
  { market: "unitedStates", ticker: "JEPI", name: "JPMorgan Equity Premium Income ETF", type: "ETF", price: 58.42, dividendYield: 8.24, annualDividend: 4.81 },
  { market: "unitedStates", ticker: "JEPQ", name: "JPMorgan Nasdaq Equity Premium ETF", type: "ETF", price: 55.17, dividendYield: 10.18, annualDividend: 5.62 },
  { market: "unitedStates", ticker: "KO", name: "Coca-Cola Co.", type: "Equity", price: 72.09, dividendYield: 2.91, annualDividend: 2.10 },
  { market: "unitedStates", ticker: "PEP", name: "PepsiCo Inc.", type: "Equity", price: 151.31, dividendYield: 3.97, annualDividend: 6.03 },
  { market: "unitedStates", ticker: "PLUG", name: "Plug Power Inc.", type: "Equity", price: 2.61, dividendYield: 0, annualDividend: 0 },
  { market: "unitedStates", ticker: "SPYI", name: "NEOS S&P 500 High Income ETF", type: "ETF", price: 48.15, dividendYield: 11.42, annualDividend: 5.50 },
  { market: "japan", ticker: "7203", name: "Toyota Motor Corp.", type: "Equity", price: 2598, dividendYield: 2.62, annualDividend: 68 },
  { market: "japan", ticker: "1306", name: "TOPIX ETF", type: "ETF", price: 2910, dividendYield: 1.84, annualDividend: 53.54 },
  { market: "china", ticker: "0700", name: "Tencent Holdings", type: "Equity", price: 542.50, dividendYield: 0.75, annualDividend: 4.07 },
  { market: "china", ticker: "9988", name: "Alibaba Group", type: "Equity", price: 148.20, dividendYield: 1.14, annualDividend: 1.69 },
];

const TRADING_INSTRUMENTS = [
  { ticker: "BTC", name: "Bitcoin", className: "Crypto", quoteCurrency: "CAD", price: 90250, change: 1.84 },
  { ticker: "ETH", name: "Ethereum", className: "Crypto", quoteCurrency: "CAD", price: 4210, change: -0.62 },
  { ticker: "SOL", name: "Solana", className: "Crypto", quoteCurrency: "CAD", price: 214, change: 3.28 },
  { ticker: "GLD", name: "Gold spot proxy", className: "Commodity", quoteCurrency: "USD", price: 238.44, change: 0.41 },
  { ticker: "SLV", name: "Silver spot proxy", className: "Commodity", quoteCurrency: "USD", price: 27.16, change: -0.18 },
  { ticker: "QQQ", name: "Nasdaq 100 ETF", className: "ETF", quoteCurrency: "USD", price: 481.20, change: 0.76 },
  { ticker: "EIT.UN", name: "Canoe EIT Income Fund", className: "ETF", quoteCurrency: "CAD", price: 13.42, change: 0.21 },
  { ticker: "PYF", name: "PenderFund Monthly Income", className: "ETF", quoteCurrency: "CAD", price: 11.78, change: 0.16 },
  { ticker: "Ford", name: "Ford Motor Co.", className: "Equity", quoteCurrency: "USD", price: 11.24, change: -0.34 },
  { ticker: "GM", name: "General Motors Co.", className: "Equity", quoteCurrency: "USD", price: 49.86, change: 0.43 },
  { ticker: "JEPI", name: "JPMorgan Equity Premium Income ETF", className: "ETF", quoteCurrency: "USD", price: 58.42, change: 0.28 },
  { ticker: "JEPQ", name: "JPMorgan Nasdaq Equity Premium ETF", className: "ETF", quoteCurrency: "USD", price: 55.17, change: 0.49 },
  { ticker: "KO", name: "Coca-Cola Co.", className: "Equity", quoteCurrency: "USD", price: 72.09, change: 0.12 },
  { ticker: "PEP", name: "PepsiCo Inc.", className: "Equity", quoteCurrency: "USD", price: 151.31, change: -0.08 },
  { ticker: "PLUG", name: "Plug Power Inc.", className: "Equity", quoteCurrency: "USD", price: 2.61, change: 1.02 },
  { ticker: "SPYI", name: "NEOS S&P 500 High Income ETF", className: "ETF", quoteCurrency: "USD", price: 48.15, change: 0.37 },
];

function formatAmount(amount, currency) {
  const decimals = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

function formatRate(rate) {
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: rate < 1 ? 4 : 2,
    maximumFractionDigits: rate < 1 ? 6 : 4,
  }).format(rate);
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
  const [pendingExchange, setPendingExchange] = useState(null);
  const [investmentAccounts, setInvestmentAccounts] = useState(INITIAL_INVESTMENT_ACCOUNTS);
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [holdingAccountFilter, setHoldingAccountFilter] = useState("all");
  const [market, setMarket] = useState("canada");
  const [marketQuery, setMarketQuery] = useState("");
  const [purchaseTicker, setPurchaseTicker] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("tfsa");
  const [purchaseFundingCurrency, setPurchaseFundingCurrency] = useState("CAD");
  const [purchaseShares, setPurchaseShares] = useState("");
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [rrspContributions, setRrspContributions] = useState("");
  const [tradeClass, setTradeClass] = useState("All");
  const [tradeTicker, setTradeTicker] = useState("BTC");
  const [tradeSide, setTradeSide] = useState("buy");
  const [tradeAccount, setTradeAccount] = useState("nonRegistered");
  const [tradeFundingCurrency, setTradeFundingCurrency] = useState("CAD");
  const [tradeUnits, setTradeUnits] = useState("");
  const [pendingTrade, setPendingTrade] = useState(null);
  const [tradeMessage, setTradeMessage] = useState("");

  const currencies = Object.keys(hubBalances);
  const toCad = (amount, currency) => amount * fxRates[currency];
  const totalCad = currencies.reduce((sum, cur) => sum + toCad(hubBalances[cur], cur), 0);
  const rrspAccount = investmentAccounts.find((account) => account.id === "rrsp");
  const rrspRoomRemaining = getContributionRoom(rrspAccount);
  const estimatedRrspLimit = annualRevenue === "" ? null : Number(annualRevenue) * 0.18;
  const rrspAvailableTarget = estimatedRrspLimit === null
    ? null
    : rrspRoomRemaining === null ? estimatedRrspLimit : Math.min(estimatedRrspLimit, Math.max(rrspRoomRemaining, 0));
  const rrspProgress = rrspAvailableTarget && Number(rrspContributions) > 0
    ? Math.min((Number(rrspContributions) / rrspAvailableTarget) * 100, 100)
    : 0;
  const tradeResults = TRADING_INSTRUMENTS.filter((instrument) => tradeClass === "All" || instrument.className === tradeClass);
  const selectedTrade = TRADING_INSTRUMENTS.find((instrument) => instrument.ticker === tradeTicker) || TRADING_INSTRUMENTS[0];
  const tradeValue = selectedTrade.price * Number(tradeUnits || 0);
  const tradeFee = tradeValue * 0.0025;
  const tradeTotal = tradeValue + tradeFee;
  const tradeDebit = tradeTotal / fxRates[selectedTrade.quoteCurrency];

  function updateInvestmentAccount(id, field, value) {
    setInvestmentAccounts((prev) => prev.map((account) => (
      account.id === id ? { ...account, [field]: value } : account
    )));
  }

  function getContributionRoom(account) {
    if (account.room === "" || account.contributed === "") return null;
    return Number(account.room) - Number(account.contributed);
  }

  function submitTrade(e) {
    e.preventDefault();
    const units = Number(tradeUnits);
    if (!Number.isFinite(units) || units <= 0) {
      setTradeMessage("Enter a quantity greater than zero.");
      return;
    }
    if (tradeSide === "buy" && tradeFundingCurrency !== selectedTrade.quoteCurrency) {
      setTradeMessage("Choose the quoted currency for this simulated order.");
      return;
    }
    const owned = holdings.find((holding) => holding.account === tradeAccount && holding.ticker === selectedTrade.ticker);
    if (tradeSide === "sell" && (!owned || owned.shares < units)) {
      setTradeMessage("The selected account does not have enough units to sell.");
      return;
    }
    if (tradeSide === "buy" && tradeTotal > hubBalances[selectedTrade.quoteCurrency]) {
      setTradeMessage(`Insufficient ${selectedTrade.quoteCurrency} balance for this order and fee.`);
      return;
    }
    setPendingTrade({ units, side: tradeSide, account: tradeAccount, instrument: selectedTrade, fee: tradeFee, total: tradeTotal });
    setTradeMessage("");
  }

  function confirmTrade() {
    if (!pendingTrade) return;
    const { units, side, account, instrument, fee, total } = pendingTrade;
    const quoteCurrency = instrument.quoteCurrency;
    setHubBalances((prev) => ({ ...prev, [quoteCurrency]: prev[quoteCurrency] + (side === "sell" ? total : -total) }));
    setHoldings((prev) => {
      const current = prev.find((holding) => holding.account === account && holding.ticker === instrument.ticker);
      if (side === "sell") {
        return prev.map((holding) => holding === current ? { ...holding, shares: holding.shares - units } : holding).filter((holding) => holding.shares > 0);
      }
      if (current) return prev.map((holding) => holding === current ? { ...holding, shares: holding.shares + units } : holding);
      return [...prev, { account, ticker: instrument.ticker, shares: units, description: instrument.className }];
    });
    addLog(`${side === "buy" ? "Bought" : "Sold"} ${units} ${instrument.ticker} in ${investmentAccounts.find((item) => item.id === account).name}; ${formatAmount(total, quoteCurrency)} ${quoteCurrency} including fee`);
    setTradeMessage(`${side === "buy" ? "Bought" : "Sold"} ${units} ${instrument.ticker}.`);
    setTradeUnits("");
    setPendingTrade(null);
  }

  const marketResults = MARKET_INSTRUMENTS.filter((instrument) => {
    const matchesMarket = instrument.market === market;
    const query = marketQuery.trim().toLowerCase();
    return matchesMarket && (!query || `${instrument.ticker} ${instrument.name} ${instrument.type} ${instrument.dividendYield > 0 ? "dividend" : ""}`.toLowerCase().includes(query));
  });

  const selectedInstrument = MARKET_INSTRUMENTS.find((instrument) => instrument.ticker === purchaseTicker);
  const selectedMarketCurrency = selectedInstrument
    ? MARKET_OPTIONS.find((option) => option.id === selectedInstrument.market).currency
    : null;
  const purchaseValue = selectedInstrument ? selectedInstrument.price * Number(purchaseShares || 0) : 0;
  const purchaseValueCad = selectedMarketCurrency ? toCad(purchaseValue, selectedMarketCurrency) : 0;
  const exchangeFeeRate = purchaseValueCad <= 1000 ? 0.03 : purchaseValueCad <= 5000 ? 0.027 : purchaseValueCad <= 10000 ? 0.023 : 0.018;
  const exchangeFee = selectedMarketCurrency && selectedMarketCurrency !== purchaseFundingCurrency
    ? purchaseValueCad * exchangeFeeRate
    : 0;
  const purchaseDebit = selectedMarketCurrency
    ? (purchaseValueCad + exchangeFee) / fxRates[purchaseFundingCurrency]
    : 0;

  function addHolding() {
    const shares = Number(purchaseShares);
    if (!purchaseTicker || !Number.isFinite(shares) || shares <= 0) {
      setPurchaseMessage("Choose a security and enter a quantity greater than zero.");
      return;
    }
    const selected = MARKET_INSTRUMENTS.find((instrument) => instrument.ticker === purchaseTicker);
    const instrumentCurrency = MARKET_OPTIONS.find((option) => option.id === selected.market).currency;
    const valueCad = selected.price * shares * fxRates[instrumentCurrency];
    const feeRate = instrumentCurrency !== purchaseFundingCurrency
      ? valueCad <= 1000 ? 0.03 : valueCad <= 5000 ? 0.027 : valueCad <= 10000 ? 0.023 : 0.018
      : 0;
    const feeCad = valueCad * feeRate;
    const debit = (valueCad + feeCad) / fxRates[purchaseFundingCurrency];
    if (debit > hubBalances[purchaseFundingCurrency]) {
      setPurchaseMessage(`Insufficient ${purchaseFundingCurrency} balance. This purchase would debit ${formatAmount(debit, purchaseFundingCurrency)} ${purchaseFundingCurrency}.`);
      return;
    }
    setHubBalances((prev) => ({ ...prev, [purchaseFundingCurrency]: prev[purchaseFundingCurrency] - debit }));
    setHoldings((prev) => {
      const existing = prev.find((holding) => holding.account === purchaseAccount && holding.ticker === selected.ticker);
      if (existing) {
        return prev.map((holding) => holding === existing ? { ...holding, shares: holding.shares + shares } : holding);
      }
      return [...prev, { account: purchaseAccount, ticker: selected.ticker, shares, description: selected.type }];
    });
    setPurchaseShares("");
    const accountName = investmentAccounts.find((account) => account.id === purchaseAccount).name;
    setPurchaseMessage(`${shares} ${selected.ticker} added to ${accountName}; ${formatAmount(debit, purchaseFundingCurrency)} ${purchaseFundingCurrency} debited.`);
    addLog(`Bought ${shares} ${selected.ticker} for ${accountName}; debited ${formatAmount(debit, purchaseFundingCurrency)} ${purchaseFundingCurrency}${feeCad ? ` including ${formatAmount(feeCad, "CAD")} CAD FX fee` : ""}`);
  }

  function addLog(text) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    setLog((prev) => [{ time: stamp, text }, ...prev]);
  }

  // Pulls live CAD-based rates from a public FX API and converts them
  // into the same "1 unit = X CAD" shape the rest of the app expects.
  // Currencies the API doesn't return (rare, but happens on free tiers)
  // fall back to their existing rate instead of breaking the app.
  async function fetchLiveRates(shouldLog = false) {
    setFxStatus("loading");
    try {
      const res = await fetch(FX_API_URL);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (!data.rates) throw new Error("Rates unavailable");
      const nextRates = { ...fxRates, CAD: 1 };
      for (const cur of currencies) {
        if (cur !== "CAD" && data.rates && data.rates[cur]) {
          nextRates[cur] = 1 / data.rates[cur];
        }
      }
      setFxRates(nextRates);
      setFxStatus("live");
      setFxUpdatedAt(new Date().toLocaleTimeString());
      if (shouldLog) addLog("Live exchange rates refreshed");
    } catch (err) {
      setFxStatus("error");
    }
  }

  useEffect(() => {
    fetchLiveRates();
    const refreshTimer = window.setInterval(() => fetchLiveRates(), 15 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, []);

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
    const exchangeFee = Math.min(amt * 0.01, 10);
    const totalDebit = amt + exchangeFee;
    if (totalDebit > hubBalances[exchangeFrom]) {
      setExchangeError(`Insufficient ${exchangeFrom} balance for the amount plus the ${formatAmount(exchangeFee, exchangeFrom)} ${exchangeFrom} fee.`);
      return;
    }
    const converted = (totalDebit * fxRates[exchangeFrom]) / fxRates[exchangeTo];
    setPendingExchange({ amount: amt, fee: exchangeFee, totalDebit, converted, from: exchangeFrom, to: exchangeTo });
    setExchangeError("");
  }

  function confirmExchange() {
    const exchange = pendingExchange;
    if (!exchange) return;
    setHubBalances((prev) => ({
      ...prev,
      [exchange.from]: prev[exchange.from] - exchange.totalDebit,
      [exchange.to]: prev[exchange.to] + exchange.converted,
    }));
    addLog(`Exchanged ${formatAmount(exchange.amount, exchange.from)} ${exchange.from} plus ${formatAmount(exchange.fee, exchange.from)} ${exchange.from} fee for ${formatAmount(exchange.converted, exchange.to)} ${exchange.to}`);
    setExchangeAmount("");
    setExchangeError("");
    setPendingExchange(null);
  }

  const inputStyle = { width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.text, fontFamily: FONT_SANS, fontSize: 13, padding: "8px 10px", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontFamily: FONT_SANS, fontSize: 12, color: COLORS.textMuted, marginBottom: 5 };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_SANS, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden", width: "calc(100% - 24px)", maxWidth: 1180, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 20 }}>Meridian</span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>The Cedar Tree Company Inc.</span>
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
          onClick={() => fetchLiveRates(true)}
          disabled={fxStatus === "loading"}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textMuted, borderRadius: 4, fontSize: 11, padding: "4px 8px", cursor: "pointer" }}
        >
          <RefreshCw size={11} />
          {fxStatus === "loading" ? "Refreshing…" : fxStatus === "live" ? `Live rates · ${fxUpdatedAt}` : fxStatus === "error" ? "Refresh failed, using placeholders" : "Using placeholder rates"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 18, padding: "0 24px", borderBottom: `1px solid ${COLORS.border}`, overflowX: "auto", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 18, minWidth: "max-content" }}>
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutGrid} label="Overview" />
        <TabButton active={tab === "invoices"} onClick={() => setTab("invoices")} icon={FileText} label="Invoices" />
        <TabButton active={tab === "accounts"} onClick={() => setTab("accounts")} icon={Landmark} label="Accounts" />
        <TabButton active={tab === "exchange"} onClick={() => setTab("exchange")} icon={ArrowRightLeft} label="Exchange" />
        <TabButton active={tab === "rates"} onClick={() => setTab("rates")} icon={BarChart3} label="Rates" />
        <TabButton active={tab === "investments"} onClick={() => setTab("investments")} icon={PieChart} label="Investments" />
        <TabButton active={tab === "market"} onClick={() => setTab("market")} icon={Search} label="Market" />
        <TabButton active={tab === "trading"} onClick={() => setTab("trading")} icon={CandlestickChart} label="Trading" />
        <TabButton active={tab === "log"} onClick={() => setTab("log")} icon={Activity} label="Audit log" />
        </div>
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
      <div style={{ padding: 24, overflowX: "auto" }}>
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

        {tab === "rates" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>Live currency table</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Reference rates against the Canadian dollar.</div>
              </div>
              <span style={{ color: fxStatus === "live" ? COLORS.success : COLORS.textMuted, fontSize: 11, whiteSpace: "nowrap" }}>
                {fxStatus === "live" ? `Updated ${fxUpdatedAt}` : fxStatus === "loading" ? "Updating…" : "Using fallback rates"}
              </span>
            </div>
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12, padding: "9px 12px", color: COLORS.textMuted, fontSize: 11, borderBottom: `1px solid ${COLORS.border}` }}>
                <span>Currency</span>
                <span>1 unit in CAD</span>
                <span>1 CAD in units</span>
                <span>Source</span>
              </div>
              {currencies.map((currency, index) => (
                <div key={currency} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12, alignItems: "center", padding: "12px", borderBottom: index === currencies.length - 1 ? "none" : `1px solid ${COLORS.border}`, fontSize: 12 }}>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, color: COLORS.text }}>{currency}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>{CURRENCY_LABEL[currency]}</div>
                  </div>
                  <span style={{ fontFamily: FONT_MONO }}>{formatRate(fxRates[currency])} CAD</span>
                  <span style={{ fontFamily: FONT_MONO }}>{formatRate(1 / fxRates[currency])} {currency}</span>
                  <span style={{ color: fxStatus === "live" ? COLORS.success : COLORS.textMuted, fontSize: 11 }}>{fxStatus === "live" ? "Live" : "Fallback"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "investments" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>Registered accounts</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Enter the contribution room and contributions shown by your government account. The remaining room is calculated here.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 26 }}>
              {investmentAccounts.map((account) => {
                const remaining = getContributionRoom(account);
                const isOverLimit = remaining !== null && remaining < 0;
                return (
                  <div key={account.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: FONT_SERIF, fontSize: 15 }}>{account.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>{account.description}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: isOverLimit ? COLORS.danger : COLORS.success }}>
                          {remaining === null ? "—" : `${formatAmount(Math.abs(remaining), "CAD")} CAD`}
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted }}>{isOverLimit ? "over contribution room" : "room remaining"}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Total room</label>
                        <input
                          style={inputStyle}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="From government account"
                          value={account.room}
                          onChange={(e) => updateInvestmentAccount(account.id, "room", e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Contributed</label>
                        <input
                          style={inputStyle}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="This contribution period"
                          value={account.contributed}
                          onChange={(e) => updateInvestmentAccount(account.id, "contributed", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>Portfolio holdings</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Select an account to review its positions. Use Market to add a security.</div>
                <select style={{ ...inputStyle, width: 170 }} value={holdingAccountFilter} onChange={(e) => setHoldingAccountFilter(e.target.value)}>
                  <option value="all">All accounts</option>
                  {investmentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </div>
            </div>
            {investmentAccounts.map((account) => {
              if (holdingAccountFilter !== "all" && holdingAccountFilter !== account.id) return null;
              const accountHoldings = holdings.filter((holding) => holding.account === account.id);
              const accountPositions = accountHoldings;
              if (!accountPositions.length) return null;
              return (
                <div key={account.id} style={{ borderTop: `1px solid ${COLORS.border}`, padding: "13px 0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: 14 }}>{account.name}</span>
                    <span style={{ color: COLORS.textMuted, fontSize: 11 }}>{accountPositions.length} positions</span>
                  </div>
                  {accountPositions.map((holding) => (
                    <div key={`${holding.account}-${holding.ticker}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 70px 80px 64px", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                      <div>
                        <span style={{ fontFamily: FONT_MONO }}>{holding.ticker}</span>
                        <span style={{ color: COLORS.textMuted, fontSize: 11, marginLeft: 8 }}>{holding.description}</span>
                      </div>
                      <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Shares</span>
                      <span style={{ fontFamily: FONT_MONO, textAlign: "right" }}>{holding.shares.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}</span>
                      <button
                        onClick={() => { setTradeTicker(holding.ticker); setTradeAccount(holding.account); setTradeSide("sell"); setTradeUnits(""); setTradeClass("All"); setTradeMessage(""); setTab("trading"); }}
                        style={{ background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textMuted, borderRadius: 4, padding: "5px 7px", cursor: "pointer", fontSize: 11 }}
                      >
                        Sell
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {tab === "market" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>Market search</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Research illustrative listings, review dividend rates, and add units to an account.</div>
              </div>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>Demo market snapshot</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Market</label>
                <select style={inputStyle} value={market} onChange={(e) => { setMarket(e.target.value); setPurchaseTicker(""); }}>
                  {MARKET_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label} ({option.currency})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Search symbol or name</label>
                <input style={inputStyle} placeholder="Try JEPI, Toyota, dividend..." value={marketQuery} onChange={(e) => setMarketQuery(e.target.value)} />
              </div>
            </div>
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.8fr 80px 90px 100px 80px", gap: 10, padding: "9px 12px", color: COLORS.textMuted, fontSize: 11, borderBottom: `1px solid ${COLORS.border}` }}>
                <span>Symbol</span><span>Name</span><span>Type</span><span>Price</span><span>Dividend yield</span><span>Action</span>
              </div>
              {marketResults.map((instrument) => (
                <div key={instrument.ticker} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.8fr 80px 90px 100px 80px", gap: 10, alignItems: "center", padding: "11px 12px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                  <span style={{ fontFamily: FONT_MONO }}>{instrument.ticker}</span>
                  <span style={{ color: COLORS.textMuted }}>{instrument.name}</span>
                  <span>{instrument.type}</span>
                  <span style={{ fontFamily: FONT_MONO }}>{formatRate(instrument.price)}</span>
                  <span style={{ color: instrument.dividendYield ? COLORS.success : COLORS.textMuted }}>{instrument.dividendYield.toFixed(2)}% <span style={{ fontSize: 10 }}>({formatRate(instrument.annualDividend)}/yr)</span></span>
                  <button onClick={() => setPurchaseTicker(instrument.ticker)} style={{ background: purchaseTicker === instrument.ticker ? COLORS.accent : "transparent", color: purchaseTicker === instrument.ticker ? "#1D1707" : COLORS.text, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 4, padding: "5px 8px", cursor: "pointer", fontSize: 11 }}>Select</button>
                </div>
              ))}
              {!marketResults.length && <div style={{ padding: 16, color: COLORS.textMuted, fontSize: 12 }}>No instruments match this search.</div>}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 15, marginBottom: 10 }}>Acquire units</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Security</label>
                  <select style={inputStyle} value={purchaseTicker} onChange={(e) => setPurchaseTicker(e.target.value)}>
                    <option value="">Choose a security</option>
                    {marketResults.map((instrument) => <option key={instrument.ticker} value={instrument.ticker}>{instrument.ticker} — {instrument.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Account</label>
                  <select style={inputStyle} value={purchaseAccount} onChange={(e) => setPurchaseAccount(e.target.value)}>
                    {investmentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fund purchase from</label>
                  <select style={inputStyle} value={purchaseFundingCurrency} onChange={(e) => setPurchaseFundingCurrency(e.target.value)}>
                    {currencies.map((currency) => <option key={currency} value={currency}>{currency} account ({formatAmount(hubBalances[currency], currency)})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Units</label>
                  <input style={inputStyle} type="number" min="0" step="0.0001" placeholder="0.0000" value={purchaseShares} onChange={(e) => setPurchaseShares(e.target.value)} />
                </div>
                <button onClick={addHolding} style={{ background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 500, padding: "8px 14px", cursor: "pointer", height: 36 }}>Add holding</button>
              </div>
              {selectedInstrument && purchaseShares && Number(purchaseShares) > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14, padding: 12, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 11 }}>
                  <div><div style={{ color: COLORS.textMuted }}>Trade value</div><div style={{ fontFamily: FONT_MONO, marginTop: 4 }}>{formatRate(purchaseValue)} {selectedMarketCurrency}</div></div>
                  <div><div style={{ color: COLORS.textMuted }}>CAD equivalent</div><div style={{ fontFamily: FONT_MONO, marginTop: 4 }}>{formatAmount(purchaseValueCad, "CAD")} CAD</div></div>
                  <div><div style={{ color: COLORS.textMuted }}>FX fee</div><div style={{ fontFamily: FONT_MONO, marginTop: 4, color: exchangeFee ? COLORS.accent : COLORS.success }}>{exchangeFee ? `${(exchangeFeeRate * 100).toFixed(1)}% · ${formatAmount(exchangeFee, "CAD")} CAD` : "None"}</div></div>
                  <div><div style={{ color: COLORS.textMuted }}>Estimated debit</div><div style={{ fontFamily: FONT_MONO, marginTop: 4 }}>{formatAmount(purchaseDebit, purchaseFundingCurrency)} {purchaseFundingCurrency}</div></div>
                </div>
              )}
              {purchaseMessage && <div style={{ color: purchaseMessage.includes("added") ? COLORS.success : COLORS.danger, fontSize: 12, marginTop: 10 }}>{purchaseMessage}</div>}
            </div>
          </div>
        )}

        {tab === "trading" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>Trading desk</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Simulated orders for crypto, commodities, and ETFs. Quotes are illustrative snapshots.</div>
              </div>
              <span style={{ color: COLORS.accent, fontSize: 11 }}>Paper trading</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {["All", "Crypto", "Commodity", "ETF"].map((assetClass) => (
                <button key={assetClass} onClick={() => setTradeClass(assetClass)} style={{ background: tradeClass === assetClass ? COLORS.accent : "transparent", color: tradeClass === assetClass ? "#1D1707" : COLORS.textMuted, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 4, padding: "6px 10px", cursor: "pointer", fontSize: 11 }}>{assetClass}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginBottom: 22 }}>
              {tradeResults.map((instrument) => (
                <button key={instrument.ticker} onClick={() => setTradeTicker(instrument.ticker)} style={{ textAlign: "left", background: tradeTicker === instrument.ticker ? COLORS.panelRaised : COLORS.panel, color: COLORS.text, border: `1px solid ${tradeTicker === instrument.ticker ? COLORS.accent : COLORS.border}`, borderRadius: 6, padding: 13, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontFamily: FONT_MONO }}>{instrument.ticker}</span><span style={{ color: instrument.change >= 0 ? COLORS.success : COLORS.danger, fontSize: 11 }}>{instrument.change >= 0 ? "+" : ""}{instrument.change.toFixed(2)}%</span></div>
                  <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 5 }}>{instrument.name}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16, marginTop: 12 }}>{formatRate(instrument.price)} <span style={{ color: COLORS.textMuted, fontSize: 10 }}>{instrument.quoteCurrency}</span></div>
                </button>
              ))}
            </div>
            <form onSubmit={submitTrade} style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 15, marginBottom: 10 }}>Place paper order</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, alignItems: "end" }}>
                <div><label style={labelStyle}>Side</label><select style={inputStyle} value={tradeSide} onChange={(e) => setTradeSide(e.target.value)}><option value="buy">Buy</option><option value="sell">Sell</option></select></div>
                <div><label style={labelStyle}>Asset</label><select style={inputStyle} value={tradeTicker} onChange={(e) => setTradeTicker(e.target.value)}>{tradeResults.map((instrument) => <option key={instrument.ticker} value={instrument.ticker}>{instrument.ticker} ({instrument.quoteCurrency})</option>)}</select></div>
                <div><label style={labelStyle}>Account</label><select style={inputStyle} value={tradeAccount} onChange={(e) => setTradeAccount(e.target.value)}>{investmentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
                <div><label style={labelStyle}>Funding currency</label><select style={inputStyle} value={tradeFundingCurrency} onChange={(e) => setTradeFundingCurrency(e.target.value)}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></div>
                <div><label style={labelStyle}>Units</label><input style={inputStyle} type="number" min="0" step="0.0001" placeholder="0.0000" value={tradeUnits} onChange={(e) => setTradeUnits(e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 14, padding: 12, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 12 }}>
                <span>Estimated value: <strong>{formatRate(tradeValue)} {selectedTrade.quoteCurrency}</strong></span>
                <span style={{ color: COLORS.accent }}>Trading fee: {formatRate(tradeFee)} {selectedTrade.quoteCurrency} (0.25%)</span>
                <button type="submit" style={{ background: COLORS.accent, color: "#1D1707", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 600, padding: "7px 12px", cursor: "pointer" }}>Review order</button>
              </div>
              {tradeMessage && <div style={{ color: tradeMessage.includes(".") && !tradeMessage.includes("Insufficient") ? COLORS.success : COLORS.danger, fontSize: 12, marginTop: 10 }}>{tradeMessage}</div>}
            </form>
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
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: COLORS.textMuted, marginTop: 10 }}>
                <span>Exchange: {formatAmount(Number(exchangeAmount), exchangeFrom)} {exchangeFrom}</span>
                <span style={{ color: COLORS.accent }}>Fee: {formatAmount(Math.min(Number(exchangeAmount) * 0.01, 10), exchangeFrom)} {exchangeFrom}</span>
                <span style={{ color: COLORS.text }}>Total debit: {formatAmount(Number(exchangeAmount) + Math.min(Number(exchangeAmount) * 0.01, 10), exchangeFrom)} {exchangeFrom}</span>
                <span>Receive: {formatAmount(((Number(exchangeAmount) + Math.min(Number(exchangeAmount) * 0.01, 10)) * fxRates[exchangeFrom]) / fxRates[exchangeTo], exchangeTo)} {exchangeTo}</span>
              </div>
            )}
          </div>
        )}

        {tab === "log" && (
          <div>
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 7, padding: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: FONT_SERIF, fontSize: 16, marginBottom: 4 }}>RRSP contribution tracker</div>
                  <div style={{ color: COLORS.textMuted, fontSize: 12 }}>A planning estimate based on 18% of earned income, bounded by the RRSP room you enter in Investments.</div>
                </div>
                <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Planning tool</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Annual earned revenue</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00 CAD" value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>RRSP contributions to date</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00 CAD" value={rrspContributions} onChange={(e) => setRrspContributions(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <div><div style={{ color: COLORS.textMuted, fontSize: 11 }}>18% income estimate</div><div style={{ fontFamily: FONT_MONO, fontSize: 16, marginTop: 4 }}>{estimatedRrspLimit === null ? "—" : `${formatAmount(estimatedRrspLimit, "CAD")} CAD`}</div></div>
                <div><div style={{ color: COLORS.textMuted, fontSize: 11 }}>Suggested available room</div><div style={{ fontFamily: FONT_MONO, fontSize: 16, marginTop: 4, color: COLORS.success }}>{rrspAvailableTarget === null ? "—" : `${formatAmount(rrspAvailableTarget, "CAD")} CAD`}</div></div>
                <div><div style={{ color: COLORS.textMuted, fontSize: 11 }}>Contribution progress</div><div style={{ fontFamily: FONT_MONO, fontSize: 16, marginTop: 4 }}>{rrspAvailableTarget === null ? "—" : `${rrspProgress.toFixed(0)}%`}</div></div>
              </div>
              <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, marginTop: 12, overflow: "hidden" }}><div style={{ width: `${rrspProgress}%`, height: "100%", background: rrspProgress >= 100 ? COLORS.accent : COLORS.teal, transition: "width 180ms ease" }} /></div>
              <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 10 }}>This is an estimate, not tax advice. Verify your personal RRSP deduction limit and annual CRA maximum before contributing.</div>
            </div>
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
      <div style={{ padding: "10px 24px", borderTop: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 11, textAlign: "right" }}>
        The Cedar Tree Company Inc.™ · Aurora Tech™
      </div>
      {pendingExchange && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5, 10, 18, 0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 10 }}>
          <div role="dialog" aria-modal="true" style={{ width: "min(420px, 100%)", background: COLORS.panelRaised, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, padding: 20, boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 18 }}>Confirm exchange</span>
              <button onClick={() => setPendingExchange(null)} aria-label="Close" style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><X size={17} /></button>
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16 }}>The fee is added to the amount debited before conversion.</div>
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Exchange amount</span><span style={{ fontFamily: FONT_MONO }}>{formatAmount(pendingExchange.amount, pendingExchange.from)} {pendingExchange.from}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.accent }}><span>Exchange fee</span><span style={{ fontFamily: FONT_MONO }}>{formatAmount(pendingExchange.fee, pendingExchange.from)} {pendingExchange.from}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, fontWeight: 600 }}><span>Total debited</span><span style={{ fontFamily: FONT_MONO }}>{formatAmount(pendingExchange.totalDebit, pendingExchange.from)} {pendingExchange.from}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.success }}><span>Estimated received</span><span style={{ fontFamily: FONT_MONO }}>{formatAmount(pendingExchange.converted, pendingExchange.to)} {pendingExchange.to}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setPendingExchange(null)} style={{ background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.text, borderRadius: 5, padding: "8px 12px", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmExchange} style={{ background: COLORS.accent, border: "none", color: "#1D1707", borderRadius: 5, padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}>Confirm exchange</button>
            </div>
          </div>
        </div>
      )}
      {pendingTrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5, 10, 18, 0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 10 }}>
          <div role="dialog" aria-modal="true" style={{ width: "min(420px, 100%)", background: COLORS.panelRaised, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, padding: 20, boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: 18 }}>Confirm paper trade</span>
              <button onClick={() => setPendingTrade(null)} aria-label="Close" style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><X size={17} /></button>
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16 }}>This is a simulated order. No live broker or exchange is connected.</div>
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Order</span><span style={{ fontFamily: FONT_MONO }}>{pendingTrade.side === "buy" ? "Buy" : "Sell"} {pendingTrade.units} {pendingTrade.instrument.ticker}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Account</span><span>{investmentAccounts.find((account) => account.id === pendingTrade.account).name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Trade value</span><span style={{ fontFamily: FONT_MONO }}>{formatRate(pendingTrade.total - pendingTrade.fee)} {pendingTrade.instrument.quoteCurrency}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.accent }}><span>Trading fee</span><span style={{ fontFamily: FONT_MONO }}>{formatRate(pendingTrade.fee)} {pendingTrade.instrument.quoteCurrency}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, fontWeight: 600 }}><span>{pendingTrade.side === "buy" ? "Total debited" : "Total credited"}</span><span style={{ fontFamily: FONT_MONO }}>{formatRate(pendingTrade.total)} {pendingTrade.instrument.quoteCurrency}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setPendingTrade(null)} style={{ background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.text, borderRadius: 5, padding: "8px 12px", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmTrade} style={{ background: COLORS.accent, border: "none", color: "#1D1707", borderRadius: 5, padding: "8px 12px", cursor: "pointer", fontWeight: 600 }}>Confirm trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}