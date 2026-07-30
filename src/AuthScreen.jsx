import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared design tokens (matches TradingDashboard)
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
  red: "#F6465D",
};

// ---------------------------------------------------------------------------
// Decorative sparkline for the marketing panel — echoes the dashboard chart
// ---------------------------------------------------------------------------
function useSparkline(len = 48) {
  const [points, setPoints] = useState(() => {
    let v = 50;
    return Array.from({ length: len }, (_, i) => {
      v += (Math.random() - 0.46) * 4;
      return { i, v };
    });
  });
  useEffect(() => {
    const id = setInterval(() => {
      setPoints((prev) => {
        const last = prev[prev.length - 1].v;
        const next = last + (Math.random() - 0.46) * 4;
        return [...prev.slice(1), { i: prev[prev.length - 1].i + 1, v: next }];
      });
    }, 900);
    return () => clearInterval(id);
  }, []);
  return points;
}

function Field({ icon: Icon, error, children }) {
  return (
    <div>
      <div
        className="flex items-center gap-2.5 h-13 rounded-2xl border px-4"
        style={{
          height: 52,
          background: c.bg,
          borderColor: error ? c.red : c.borderStrong,
        }}
      >
        <Icon size={17} style={{ color: c.textFaint, flexShrink: 0 }} />
        {children}
      </div>
      {error && (
        <div className="mt-1.5 text-xs font-medium" style={{ color: c.red }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const spark = useSparkline();
  const sparkUp = spark[spark.length - 1].v >= spark[0].v;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setShowPw(false);
    setShowPw2(false);
  }

  function validate() {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Enter your full name";
    if (!form.email.trim()) e.email = "Enter your email";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Enter your password";
    else if (mode === "signup" && form.password.length < 8)
      e.password = "Use at least 8 characters";
    if (mode === "signup" && form.confirm !== form.password)
      e.confirm = "Passwords don't match";
    if (mode === "signup" && !agree) e.agree = "Accept the terms to continue";
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    window.setTimeout(() => setSubmitting(false), 1200);
  }

  const inputStyle = {
    color: c.text,
    background: "transparent",
  };

  return (
    <div
      className="min-h-screen w-full font-sans flex"
      style={{ background: c.bg, color: c.text }}
    >
      {/* ================= LEFT / MARKETING PANEL (desktop only) ================= */}
      <div
        className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, #171B26 0%, #0B0E14 60%)",
          borderRight: `1px solid ${c.border}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-base"
            style={{ background: c.amber, color: "#181205" }}
          >
            P
          </div>
          <span className="text-sm font-semibold tracking-widest" style={{ color: c.textDim }}>
            PRIMEVEST
          </span>
        </div>

        <div>
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold mb-6"
              style={{ background: c.amberDim, color: c.amber }}
            >
              <TrendingUp size={12} />
              Live markets, 24/7
            </div>
            <h1 className="text-4xl font-bold leading-[1.15] mb-4 max-w-md">
              Your edge starts the moment you log in.
            </h1>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: c.textDim }}>
              Track positions, execute trades, and watch the tape update in
              real time — all from one account.
            </p>
          </div>

          {/* signature sparkline strip */}
          <div
            className="rounded-3xl border p-5"
            style={{ background: c.surface, borderColor: c.border }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide" style={{ color: c.textDim }}>
                VOL/100 INDEX
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: sparkUp ? c.green : c.red }}
              >
                {sparkUp ? "▲" : "▼"} {Math.abs(spark[spark.length - 1].v - spark[0].v).toFixed(2)}%
              </span>
            </div>
            <div style={{ height: 64 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={sparkUp ? c.green : c.red}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="text-xs" style={{ color: c.textFaint }}>
          © {new Date().getFullYear()} PrimeVest. Trading involves risk.
        </div>
      </div>

      {/* ================= RIGHT / FORM PANEL ================= */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-base"
              style={{ background: c.amber, color: "#181205" }}
            >
              P
            </div>
            <span className="text-sm font-semibold tracking-widest" style={{ color: c.textDim }}>
              PRIMEVEST
            </span>
          </div>

          {/* mode switch */}
          <div
            className="flex p-1 rounded-2xl mb-7"
            style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}
          >
            {[
              { id: "login", label: "Log In" },
              { id: "signup", label: "Create Account" },
            ].map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchMode(tab.id)}
                  className="flex-1 h-11 rounded-xl text-sm font-bold transition"
                  style={{
                    background: active ? c.amber : "transparent",
                    color: active ? "#181205" : c.textDim,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1.5">
              {mode === "login" ? "Welcome back" : "Set up your account"}
            </h2>
            <p className="text-sm" style={{ color: c.textDim }}>
              {mode === "login"
                ? "Log in to pick up right where you left off."
                : "Takes under a minute. No card required."}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {mode === "signup" && (
              <Field icon={User} error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="flex-1 outline-none text-sm"
                  style={inputStyle}
                />
              </Field>
            )}

            <Field icon={Mail} error={errors.email}>
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="Email address"
                type="email"
                autoComplete="email"
                className="flex-1 outline-none text-sm"
                style={inputStyle}
              />
            </Field>

            <Field icon={Lock} error={errors.password}>
              <input
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Password"
                type={showPw ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="flex-1 outline-none text-sm"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <EyeOff size={17} style={{ color: c.textFaint }} />
                ) : (
                  <Eye size={17} style={{ color: c.textFaint }} />
                )}
              </button>
            </Field>

            {mode === "signup" && (
              <Field icon={Lock} error={errors.confirm}>
                <input
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  placeholder="Confirm password"
                  type={showPw2 ? "text" : "password"}
                  autoComplete="new-password"
                  className="flex-1 outline-none text-sm"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((v) => !v)}
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  {showPw2 ? (
                    <EyeOff size={17} style={{ color: c.textFaint }} />
                  ) : (
                    <Eye size={17} style={{ color: c.textFaint }} />
                  )}
                </button>
              </Field>
            )}

            {mode === "login" ? (
              <div className="flex items-center justify-between -mt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: c.textDim }}>
                  <button
                    type="button"
                    onClick={() => setRemember((v) => !v)}
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{
                      background: remember ? c.amber : "transparent",
                      border: `1px solid ${remember ? c.amber : c.borderStrong}`,
                    }}
                  >
                    {remember && <Check size={11} style={{ color: "#181205" }} strokeWidth={3} />}
                  </button>
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold"
                  style={{ color: c.amber }}
                >
                  Forgot password?
                </button>
              </div>
            ) : (
              <div>
                <label className="flex items-start gap-2.5 text-xs cursor-pointer" style={{ color: c.textDim }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAgree((v) => !v);
                      setErrors((e) => ({ ...e, agree: undefined }));
                    }}
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: agree ? c.amber : "transparent",
                      border: `1px solid ${agree ? c.amber : (errors.agree ? c.red : c.borderStrong)}`,
                    }}
                  >
                    {agree && <Check size={11} style={{ color: "#181205" }} strokeWidth={3} />}
                  </button>
                  <span>
                    I agree to the{" "}
                    <span className="font-semibold" style={{ color: c.text }}>Terms of Service</span>{" "}
                    and{" "}
                    <span className="font-semibold" style={{ color: c.text }}>Privacy Policy</span>.
                  </span>
                </label>
                {errors.agree && (
                  <div className="mt-1.5 text-xs font-medium" style={{ color: c.red }}>
                    {errors.agree}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-13 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mt-1 transition"
              style={{
                height: 52,
                background: c.amber,
                color: "#181205",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                "Please wait…"
              ) : (
                <>
                  {mode === "login" ? "Log In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: c.textDim }}>
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="font-semibold"
                  style={{ color: c.amber }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-semibold"
                  style={{ color: c.amber }}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
