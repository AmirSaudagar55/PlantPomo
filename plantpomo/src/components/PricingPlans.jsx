import React, { useMemo, useState } from "react";
import { getPricing } from "../lib/pricingTiers";
import {
  BarChart3, CalendarClock, CheckCircle2, Download, Sparkles,
  Lock, Leaf, Trees, Mountain, XCircle, TrendingUp, Flame,
  Shield,
} from "lucide-react";

/* ── Asset previews (emoji stand-ins — swap for real PNGs once available) ── */
const PREMIUM_PLANTS = [
  { emoji: "🌸", name: "Sakura", rarity: "Rare" },
  { emoji: "🌲", name: "Ancient Oak", rarity: "Legendary" },
  { emoji: "🌴", name: "Tropical Palm", rarity: "Uncommon" },
  { emoji: "❄️", name: "Frost Fern", rarity: "Legendary" },
  { emoji: "🔥", name: "Ember Root", rarity: "Mythical" },
];

const RARITY_COLOR = {
  Uncommon: "text-green-400 bg-green-400/10 border-green-400/20",
  Rare: "text-blue-400  bg-blue-400/10  border-blue-400/20",
  Legendary: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Mythical: "text-amber-400 bg-amber-400/10  border-amber-400/20",
};

/* ── Feature lists ───────────────────────────────────────────────────────── */
const FREE_FEATURES = [
  "Unlimited focus & break sessions",
  "Stopwatch and Pomodoro modes",
  "Basic activity history (7 days)",
  "Isometric garden (3 starter plants)",
  "YouTube background videos",
  "Local music file player",
  "Streak tracking",
];

const FREE_MISSING = [
  "Detailed analytics dashboard",
  "Weekly / monthly reports + CSV export",
  "Premium trees & land species",
  "Session drill-downs & distraction trends",
  "Streak-risk alerts",
  "Priority support",
];

const PRO_FEATURES = [
  { icon: <BarChart3 size={14} />, text: "Advanced focus analytics dashboard (focus score, completion rate, distraction trend)" },
  { icon: <TrendingUp size={14} />, text: "Weekly & monthly performance reports with CSV export" },
  { icon: <CalendarClock size={14} />, text: "Full session history with per-session drill-downs" },
  { icon: <Flame size={14} />, text: "Streak-risk alerts & personalized productivity suggestions" },
  { icon: <Trees size={14} />, text: "Exclusive Premium Trees — Sakura, Ancient Oak, Frost Fern, Ember Root…" },
  { icon: <Mountain size={14} />, text: "Exclusive Island Backgrounds & premium land varieties" },
  { icon: <Download size={14} />, text: "CSV & JSON data export of all sessions" },
  { icon: <Shield size={14} />, text: "Priority support & early feature access" },
];

/* ── Component ───────────────────────────────────────────────────────────── */
const PricingPlans = ({ theme = "dark" }) => {
  const [billing, setBilling] = useState("yearly");

  // Read country code cached by useUserLocation (written on first login)
  const pricing = useMemo(() => {
    const cc = (() => { try { return localStorage.getItem("plantpomo:country_code"); } catch { return null; } })();
    return getPricing(cc);
  }, []);

  const isYearly = billing === "yearly";
  const price = isYearly ? pricing.yearlyMonthly : pricing.monthly;
  const sym = pricing.symbol;

  return (
    <section className="w-full max-w-6xl mx-auto px-2 sm:px-4 pb-8">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold mb-4">
          <Sparkles size={12} />
          PlantPomo Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
          Grow further, focus deeper
        </h1>
        <p className="text-sm text-white/55 max-w-md mx-auto">
          Unlock premium analytics and exclusive garden species to make every session count.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex p-1 mt-6 rounded-xl bg-white/[0.05] border border-white/10">
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${billing === b
                ? "bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                : "text-white/50 hover:text-white"
                }`}
            >
              {b}
              {b === "yearly" && (
                <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
                  Save ${pricing.yearlySavings}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pricing cards ──────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">

        {/* FREE CARD */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={16} className="text-white/40" />
              <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Free</span>
            </div>
            <p className="text-4xl font-black text-white/80 mb-1">$0</p>
            <p className="text-xs text-white/35">Forever free. No card required.</p>
          </div>

          {/* Free features */}
          <ul className="flex flex-col gap-2 mb-5 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-white/55">
                <CheckCircle2 size={13} className="text-white/25 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
            {FREE_MISSING.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-white/25 line-through">
                <XCircle size={13} className="text-white/15 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <button className="w-full py-3 rounded-xl border border-white/15 bg-white/5 text-white/50 font-semibold text-sm cursor-default">
            Current Plan
          </button>
        </div>

        {/* PRO CARD */}
        <div className="relative rounded-2xl overflow-hidden flex flex-col">
          {/* Glow border */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.12),inset_0_0_40px_rgba(52,211,153,0.04)]" />

          <div className="relative bg-gradient-to-b from-[#071a0f]/95 to-[#040d08]/98 p-6 flex flex-col flex-1">
            {/* Best Value badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-[#39ff14]/15 border border-[#39ff14]/30 text-[#39ff14] text-[10px] font-bold uppercase tracking-widest">
              Best Value
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300 uppercase tracking-widest">Pro</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-white">{sym}{price}</p>
                <span className="text-sm text-white/50 mb-1">/ month</span>
              </div>
              {isYearly ? (
                <p className="text-xs text-emerald-300/70 mt-1">
                  Billed {sym}{pricing.yearlyTotal} / year — saves {sym}{pricing.yearlySavings}
                </p>
              ) : (
                <p className="text-xs text-white/35 mt-1">Billed monthly</p>
              )}
            </div>

            {/* Pro features */}
            <ul className="flex flex-col gap-2.5 mb-6 flex-1">
              {PRO_FEATURES.map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-xs text-white/75">
                  <span className="text-emerald-400 shrink-0 mt-0.5">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button className="relative w-full py-3.5 rounded-xl font-bold text-sm text-black overflow-hidden group transition-all active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-[#39ff14] group-hover:brightness-110 transition-all" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_70%)] transition-opacity" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Sparkles size={15} />
                {isYearly ? `Get Pro — $${pricing.yearlyMonthly}/mo` : `Get Pro — $${pricing.monthly}/mo`}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* ── Premium Species showcase ────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={14} className="text-amber-400" />
          <p className="text-sm font-bold text-white/80">Premium Garden Species</p>
          <span className="ml-auto text-xs text-white/30">Pro exclusive</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PREMIUM_PLANTS.map(({ emoji, name, rarity }) => (
            <div key={name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
              <span className="text-3xl">{emoji}</span>
              <span className="text-[11px] font-semibold text-white/70">{name}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${RARITY_COLOR[rarity]}`}>
                {rarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Analytics highlight ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-emerald-400" />
          <p className="text-sm font-bold text-white/80">Detailed Analytics</p>
          <span className="ml-auto text-xs text-white/30">Pro exclusive</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp size={14} />, label: "Focus Score", desc: "Daily focus quality score based on session consistency" },
            { icon: <BarChart3 size={14} />, label: "Session Reports", desc: "Weekly & monthly breakdowns with CSV export" },
            { icon: <Flame size={14} />, label: "Streak Alerts", desc: "Know before you break your streak with smart nudges" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-emerald-400 mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-bold text-white/75">{label}</p>
                <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/25 text-center mt-4">
          Preview only — payment integration launching next sprint.
        </p>
      </div>
    </section>
  );
};

export default PricingPlans;
