import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Minus,
  TrendingUp,
  Bot,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  LogOut,
  Wallet,
  UserCog,
  ArrowLeftRight,
  History,
  Gift,
  Moon,
  HelpCircle,
  Shield,
  MessageCircle,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens (custom hex values, applied via inline style since arbitrary
// Tailwind classes aren't available in this environment)
// ---------------------------------------------------------------------------
const c = {
  bg: "#0B0E14",
  surface: "#10141D",
  surfaceAlt: "#151A25",
  elevated: "#1A2030",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#E9ECF2",
  textDim: "#7D8699",
  textFaint: "#4B5566",
  amber: "#FFB020",
  amberDim: "rgba(255,176,32,0.12)",
  green: "#16C784",
  greenDim: "rgba(22,199,132,0.14)",
  red: "#F6465D",
  redDim: "rgba(246,70,93,0.14)",
};

// ---------------------------------------------------------------------------
// Mock data generation
// ---------------------------------------------------------------------------
function makeInitialSeries(base, points) {
  const now = Date.now();
  let price = base * 1.0215; // start ~2.15% above so we trend down to `base`
  const out = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = (base - price) * 0.02;
    const noise = (Math.random() - 0.5) * base * 0.0009;
    price = price + drift + noise;
    out.push({
      idx: i,
      time: new Date(now - (points - i) * 1000),
      price: Number(price.toFixed(2)),
    });
  }
  out[out.length - 1].price = base;
  return out;
}

const BASE_PRICE = 9295.61;
const INITIAL_DIGIT_STATS = [8.1, 9.4, 10.2, 9.8, 10.6, 9.1, 10.9, 8.7, 11.3, 11.9];

// Nudge each digit's percentage by a small random amount, then renormalize
// so the row always sums to 100% — simulates a live-updating distribution.
function rotateDigitStats(prev) {
  const nudged = prev.map((v) => Math.max(2, v + (Math.random() - 0.5) * 3.2));
  const sum = nudged.reduce((a, b) => a + b, 0);
  return nudged.map((v) => Number(((v / sum) * 100).toFixed(1)));
}

export default function TradingDashboard() {
  const [data, setData] = useState(() => makeInitialSeries(BASE_PRICE, 80));
  const [zoomPoints, setZoomPoints] = useState(40);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);
  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("evenodd");
  const [mode, setMode] = useState("AUTO");
  const [stake, setStake] = useState(10);
  const [stakeInput, setStakeInput] = useState("10");
  const [targetProfit, setTargetProfit] = useState("200");
  const [stopLoss, setStopLoss] = useState("999");
  const [multiplier, setMultiplier] = useState("2");
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [flash, setFlash] = useState(null);
  const [digitStats, setDigitStats] = useState(INITIAL_DIGIT_STATS);

  const openingPriceRef = useRef(data[0].price);

  // simulate a live-ish feed
  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1].price;
        const noise = (Math.random() - 0.5) * BASE_PRICE * 0.0011;
        const next = Number((last + noise).toFixed(2));
        const nextPoint = { idx: prev[prev.length - 1].idx + 1, time: new Date(), price: next };
        const merged = [...prev.slice(1), nextPoint];
        return merged;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // rotate the last-digit probabilities to feel live, in step with the tick feed
  useEffect(() => {
    const id = setInterval(() => {
      setDigitStats((prev) => rotateDigitStats(prev));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const visibleData = useMemo(() => data.slice(-zoomPoints), [data, zoomPoints]);
  const currentPrice = data[data.length - 1].price;
  const changePct = useMemo(() => {
    const open = openingPriceRef.current;
    return ((currentPrice - open) / open) * 100;
  }, [currentPrice]);
  const isUp = changePct >= 0;
  const trendColor = isUp ? c.green : c.red;

  const payoutRate = 1.952; // 95.2% return
  const payout = (stake * payoutRate).toFixed(2);

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  function commitStake(val) {
    const n = Math.max(0, Number(val) || 0);
    setStake(n);
    setStakeInput(String(n));
  }

  function handlePlaceTrade(side) {
    setFlash(side);
    window.setTimeout(() => setFlash(null), 500);
  }

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{ background: c.bg, color: c.text }}
    >
      {/* ================= TOP NAV ================= */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between gap-2 px-3 sm:px-6 h-16 border-b backdrop-blur"
        style={{ background: "rgba(11,14,20,0.92)", borderColor: c.border }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-base"
            style={{ background: c.amber, color: "#181205" }}
          >
            T
          </div>
          <span className="hidden sm:block text-sm font-semibold tracking-wide" style={{ color: c.textDim }}>
            TRADEX
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Balance dropdown */}
          <div className="relative">
            <button
              onClick={() => setBalanceMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl border text-sm font-semibold font-mono"
              style={{ background: c.surfaceAlt, borderColor: c.border, color: c.text }}
            >
              $0.00
              <ChevronDown size={15} style={{ color: c.textDim }} />
            </button>
            {balanceMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl border overflow-hidden shadow-2xl"
                style={{ background: c.elevated, borderColor: c.border }}
              >
                <button className="w-full text-left px-4 py-3 text-sm hover:bg-white/5" style={{ color: c.text }}>
                  Real account
                  <div className="text-xs font-mono" style={{ color: c.textDim }}>$0.00</div>
                </button>
                <div style={{ borderTop: `1px solid ${c.border}` }} />
                <button className="w-full text-left px-4 py-3 text-sm hover:bg-white/5" style={{ color: c.text }}>
                  Demo account
                  <div className="text-xs font-mono" style={{ color: c.textDim }}>$10,000.00</div>
                </button>
              </div>
            )}
          </div>

          <button
            className="hidden xs:flex items-center h-10 px-4 rounded-xl text-sm font-bold"
            style={{ background: c.amber, color: "#181205" }}
          >
            Deposit
          </button>
          <button
            className="flex sm:hidden items-center justify-center w-10 h-10 rounded-xl text-sm font-bold"
            style={{ background: c.amber, color: "#181205" }}
            aria-label="Deposit"
          >
            +
          </button>

          <button
            className="relative flex items-center justify-center w-10 h-10 rounded-xl border"
            style={{ background: c.surfaceAlt, borderColor: c.border }}
            aria-label="Notifications"
          >
            <Bell size={18} style={{ color: c.textDim }} />
            <span
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
              style={{ background: c.amber }}
            />
          </button>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border"
            style={{ background: c.surfaceAlt, borderColor: c.border }}
            aria-label="Menu"
          >
            <Menu size={18} style={{ color: c.textDim }} />
          </button>
        </div>
      </header>

      {/* ================= SIDEBAR DRAWER ================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="relative w-80 max-w-[85%] h-full overflow-y-auto"
            style={{ background: c.surface, borderLeft: `1px solid ${c.border}` }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: c.border }}>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                <X size={22} style={{ color: c.text }} />
              </button>
              <span className="text-lg font-bold">Menu</span>
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: c.text }}>
                🇬🇧 EN
              </span>
            </div>

            <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: c.border }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                style={{ background: "#3B6DF0", color: "#FFFFFF" }}
              >
                B
              </div>
              <div>
                <div className="text-base font-bold">Brian Kibet</div>
                <div className="text-sm" style={{ color: c.textDim }}>b****@gmail.com</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: c.border }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: "#F0475B", color: "#FFFFFF" }}
              >
                P
              </div>
              <span className="text-base font-bold">PrimeVest</span>
            </div>

            <nav className="py-2 border-b" style={{ borderColor: c.border }}>
              {[
                { icon: UserCog, label: "Account Settings" },
                { icon: Wallet, label: "Deposit" },
                { icon: ArrowLeftRight, label: "Withdraw" },
                { icon: History, label: "History" },
                { icon: Gift, label: "Refer & Earn", highlight: true },
              ].map(({ icon: Icon, label, highlight }) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-white/5"
                  style={{
                    color: highlight ? "#C77DFF" : c.text,
                    background: highlight ? "rgba(124,58,237,0.18)" : "transparent",
                  }}
                >
                  <span className="flex items-center gap-4">
                    <Icon size={19} style={{ color: highlight ? "#C77DFF" : c.textDim }} />
                    <span className="font-medium">{label}</span>
                  </span>
                  <ChevronRight size={17} style={{ color: highlight ? "#C77DFF" : c.textDim }} />
                </button>
              ))}
            </nav>

            <nav className="py-2 border-b" style={{ borderColor: c.border }}>
              <div className="w-full flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <span className="flex items-center gap-4">
                  <Moon size={19} style={{ color: c.textDim }} />
                  <span className="font-medium">Dark Theme</span>
                </span>
                <button
                  onClick={() => setDarkTheme((v) => !v)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ background: darkTheme ? "#3B82F6" : c.borderStrong }}
                  aria-label="Toggle dark theme"
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{ transform: darkTheme ? "translateX(22px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
              {[
                { icon: Bell, label: "Notifications" },
                { icon: HelpCircle, label: "Help Centre" },
                { icon: Shield, label: "Security" },
                { icon: MessageCircle, label: "Live Chat" },
                { icon: Info, label: "About PrimeVest" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-4 px-5 py-4 text-sm hover:bg-white/5"
                  style={{ color: c.text }}
                >
                  <Icon size={19} style={{ color: c.textDim }} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>

            <button
              className="w-full flex items-center gap-3 px-5 py-5 text-sm font-medium"
              style={{ color: c.red }}
            >
              <LogOut size={19} />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 pb-28 lg:pb-10 pt-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-4">
          {/* LEFT / MAIN COLUMN */}
          <div className="lg:col-span-2 min-w-0">
            {/* Market tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
              {[
                { id: "matches", label: "Matches/Differs" },
                { id: "evenodd", label: "Even/Odd" },
                { id: "overunder", label: "Over/Under" },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-shrink-0 h-12 px-5 rounded-2xl text-sm font-semibold whitespace-nowrap transition"
                    style={{
                      background: active ? c.amber : c.surfaceAlt,
                      color: active ? "#181205" : c.textDim,
                      border: `1px solid ${active ? c.amber : c.border}`,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Chart card */}
            <div
              className="rounded-3xl border overflow-hidden mb-4"
              style={{ background: c.bg, borderColor: c.border, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            >
              <div className="flex items-start justify-between px-4 sm:px-5 pt-4 pb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: c.amber, boxShadow: `0 0 8px ${c.amber}` }}
                    />
                    <span className="text-xs font-semibold tracking-wide" style={{ color: c.textDim }}>
                      VOL 10 (1S)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums">
                      {currentPrice.toFixed(2)}
                    </span>
                    <span
                      className="flex items-center gap-0.5 text-sm font-semibold font-mono"
                      style={{ color: trendColor }}
                    >
                      {isUp ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      {changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomPoints((z) => Math.min(data.length, z + 10))}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border"
                    style={{ background: c.surfaceAlt, borderColor: c.border }}
                    aria-label="Zoom out"
                  >
                    <Minus size={16} style={{ color: c.textDim }} />
                  </button>
                  <button
                    onClick={() => setZoomPoints((z) => Math.max(15, z - 10))}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border"
                    style={{ background: c.surfaceAlt, borderColor: c.border }}
                    aria-label="Zoom in"
                  >
                    <Plus size={16} style={{ color: c.textDim }} />
                  </button>
                </div>
              </div>

              <div className="h-56 sm:h-72 w-full px-1 sm:px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.045)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(t) =>
                        new Date(t).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })
                      }
                      tick={{ fill: c.textFaint, fontSize: 10 }}
                      axisLine={{ stroke: c.border }}
                      tickLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      orientation="right"
                      domain={["auto", "auto"]}
                      tick={{ fill: c.textFaint, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={54}
                      tickFormatter={(v) => v.toFixed(1)}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={trendColor}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Digit selector */}
            <div
              className="rounded-3xl border mb-4 px-3 py-4"
              style={{ background: c.surface, borderColor: c.border }}
            >
              <div className="text-xs font-semibold tracking-wide mb-3 px-1" style={{ color: c.textDim }}>
                LAST DIGIT PROBABILITY
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {digitStats.map((pct, digit) => {
                  const selected = digit === selectedDigit;
                  const highest = pct === Math.max(...digitStats);
                  return (
                    <button
                      key={digit}
                      onClick={() => setSelectedDigit(digit)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5"
                    >
                      <span
                        className="flex items-center justify-center rounded-full font-bold text-base transition"
                        style={{
                          width: 46,
                          height: 46,
                          background: selected ? c.amber : c.elevated,
                          color: selected ? "#181205" : c.text,
                          border: `1px solid ${selected ? c.amber : c.border}`,
                        }}
                      >
                        {digit}
                      </span>
                      <span
                        className="text-[11px] font-mono tabular-nums transition-all duration-700 ease-out"
                        style={{
                          color: selected ? c.amber : highest ? c.text : c.textDim,
                          fontWeight: highest ? 700 : 400,
                        }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT / TRADING PANEL */}
          <div className="lg:col-span-1">
            <div
              className="rounded-3xl border p-4 sm:p-5 mb-4"
              style={{ background: c.surface, borderColor: c.border }}
            >
              {/* AUTO / MANUAL */}
              <div
                className="flex p-1 rounded-2xl mb-5"
                style={{ background: c.bg }}
              >
                {["AUTO", "MANUAL"].map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex-1 h-11 rounded-xl text-sm font-bold transition"
                      style={{
                        background: active ? c.amber : "transparent",
                        color: active ? "#181205" : c.textDim,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Stake */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold tracking-wide" style={{ color: c.textDim }}>
                    STAKE
                  </label>
                  <span className="text-xs font-mono" style={{ color: c.textFaint }}>
                    Payout&nbsp;
                    <span className="font-bold" style={{ color: c.amber }}>
                      ${payout}
                    </span>
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 h-14 rounded-2xl border px-4"
                  style={{ background: c.bg, borderColor: c.borderStrong }}
                >
                  <span className="text-xl font-bold font-mono" style={{ color: c.textDim }}>$</span>
                  <input
                    value={stakeInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      setStakeInput(v);
                    }}
                    onBlur={(e) => commitStake(e.target.value)}
                    inputMode="decimal"
                    className="flex-1 bg-transparent outline-none text-xl font-bold font-mono"
                    style={{ color: c.text }}
                  />
                </div>
                <div className="grid grid-cols-6 gap-1.5 mt-2.5">
                  {quickAmounts.map((amt) => {
                    const active = stake === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => commitStake(amt)}
                        className="h-9 rounded-lg text-xs font-semibold font-mono transition"
                        style={{
                          background: active ? c.amberDim : c.elevated,
                          color: active ? c.amber : c.textDim,
                          border: `1px solid ${active ? c.amber : c.border}`,
                        }}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 settings inputs */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <div className="flex flex-col">
                  <label className="text-[11px] mb-1.5" style={{ color: c.textDim }}>
                    TARGET PROFIT
                  </label>
                  <div
                    className="flex items-center h-12 rounded-xl border px-2 justify-center"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <span className="text-xs font-mono mr-0.5" style={{ color: c.textFaint }}>$</span>
                    <input
                      value={targetProfit}
                      onChange={(e) => setTargetProfit(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="w-full bg-transparent outline-none text-sm font-bold font-mono text-center"
                      style={{ color: c.text }}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] mb-1.5" style={{ color: c.textDim }}>
                    STOP LOSS
                  </label>
                  <div
                    className="flex items-center h-12 rounded-xl border px-2 justify-center"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <span className="text-xs font-mono mr-0.5" style={{ color: c.textFaint }}>$</span>
                    <input
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="w-full bg-transparent outline-none text-sm font-bold font-mono text-center"
                      style={{ color: c.text }}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] mb-1.5" style={{ color: c.textDim }}>
                    MULTIPLIER
                  </label>
                  <div
                    className="flex items-center h-12 rounded-xl border px-2 justify-center"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <span className="text-xs font-mono mr-0.5" style={{ color: c.textFaint }}>x</span>
                    <input
                      value={multiplier}
                      onChange={(e) => setMultiplier(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="w-full bg-transparent outline-none text-sm font-bold font-mono text-center"
                      style={{ color: c.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePlaceTrade("even")}
                  className="flex flex-col items-center justify-center rounded-2xl py-5 transition"
                  style={{
                    background: `linear-gradient(135deg, ${c.green}, #0EA96B)`,
                    boxShadow: flash === "even" ? `0 0 0 3px ${c.green}` : "0 10px 24px rgba(22,199,132,0.3)",
                    transform: flash === "even" ? "scale(0.97)" : "scale(1)",
                  }}
                >
                  <span className="text-lg font-extrabold text-white">Even</span>
                  <span className="text-xs font-semibold text-white/85 mt-1">95.2%</span>
                  <span className="text-sm font-bold font-mono text-white mt-1">${payout}</span>
                </button>
                <button
                  onClick={() => handlePlaceTrade("odd")}
                  className="flex flex-col items-center justify-center rounded-2xl py-5 transition"
                  style={{
                    background: `linear-gradient(135deg, ${c.red}, #D8283F)`,
                    boxShadow: flash === "odd" ? `0 0 0 3px ${c.red}` : "0 10px 24px rgba(246,70,93,0.3)",
                    transform: flash === "odd" ? "scale(0.97)" : "scale(1)",
                  }}
                >
                  <span className="text-lg font-extrabold text-white">Odd</span>
                  <span className="text-xs font-semibold text-white/85 mt-1">95.2%</span>
                  <span className="text-sm font-bold font-mono text-white mt-1">${payout}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= BOTTOM NAV ================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-[70px] border-t lg:hidden"
        style={{ background: c.surface, borderColor: c.border }}
      >
        {[
          { icon: TrendingUp, label: "Trade", active: true },
          { icon: Bot, label: "AI", active: false },
          { icon: Briefcase, label: "Positions", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <button key={label} className="flex flex-col items-center gap-1">
            <Icon size={21} style={{ color: active ? c.amber : c.textDim }} />
            <span className="text-[11px] font-medium" style={{ color: active ? c.amber : c.textDim }}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
