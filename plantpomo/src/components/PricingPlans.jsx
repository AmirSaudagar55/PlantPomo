import React, { useMemo, useState } from "react";
import { BarChart3, CalendarClock, CheckCircle2, Download, Sparkles } from "lucide-react";

const features = [
  "Advanced focus analytics dashboard (focus score, distraction trend, completion rate)",
  "Weekly and monthly performance reports with CSV export",
  "Unlimited activity history and deep session drill-downs",
  "Streak-risk alerts and personalized productivity suggestions",
  "Priority support and early access to upcoming premium tools",
];

const PricingPlans = ({ theme = "dark" }) => {
  const [billing, setBilling] = useState("yearly");
  const monthlyActive = billing === "monthly";
  const yearlyActive = billing === "yearly";

  const pricing = useMemo(() => {
    const monthlyPrice = 7.99;
    const yearlyPrice = 79;
    const monthlyYearCost = monthlyPrice * 12;
    const yearlySavings = (monthlyYearCost - yearlyPrice).toFixed(2);
    const yearlyEquivalent = (yearlyPrice / 12).toFixed(2);

    return {
      monthlyPrice: monthlyPrice.toFixed(2),
      yearlyPrice: yearlyPrice.toFixed(2),
      yearlySavings,
      yearlyEquivalent,
    };
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto px-2 sm:px-4 pb-4">
      <div className="neon-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400/80 font-semibold">
              Upgrade
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              PlantPomo Pro
            </h2>
            <p className={`text-sm mt-2 ${theme === "dark" ? "text-white/65" : "text-slate-600"}`}>
              Build stronger focus habits with premium insights and detailed analytics.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                billing === "monthly"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                billing === "yearly"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <article
            className={`rounded-2xl p-4 sm:p-5 ${
              monthlyActive
                ? "border border-emerald-400/45 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                : "border border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Monthly Pro</h3>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Flexible
              </span>
            </div>
            <p className="mt-3">
              <span className="text-3xl font-black">${pricing.monthlyPrice}</span>
              <span className="text-sm text-white/60"> / month</span>
            </p>
            <p className={`mt-2 text-xs ${theme === "dark" ? "text-white/55" : "text-slate-500"}`}>
              Best for trying premium analytics with low commitment.
            </p>
            <button
              className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                monthlyActive
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                  : "border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              {monthlyActive ? "Selected" : "Choose Monthly"}
            </button>
          </article>

          <article
            className={`rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(16,185,129,0.12)] ${
              yearlyActive
                ? "border border-emerald-400/45 bg-emerald-500/10"
                : "border border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${yearlyActive ? "text-emerald-200" : ""}`}>Yearly Pro</h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Most Popular
              </span>
            </div>
            <p className="mt-3">
              <span className="text-3xl font-black text-emerald-200">${pricing.yearlyEquivalent}</span>
              <span className="text-sm text-emerald-100/80"> / month</span>
            </p>
            <p className="text-xs text-emerald-100/80 mt-1">
              Billed yearly at ${pricing.yearlyPrice} (save ${pricing.yearlySavings} / year)
            </p>
            <p className={`mt-2 text-xs ${theme === "dark" ? "text-emerald-100/80" : "text-emerald-800/80"}`}>
              Best value for users who want long-term progress insights.
            </p>
            <button
              className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
                yearlyActive
                  ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {yearlyActive ? "Selected" : "Choose Yearly"}
            </button>
          </article>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="text-sm font-bold mb-3">What Pro unlocks</p>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/75">
                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-emerald-400" />
            <span className="text-white/70">Detailed Analytics</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-2">
            <Download size={14} className="text-emerald-400" />
            <span className="text-white/70">CSV Exports</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-2">
            <CalendarClock size={14} className="text-emerald-400" />
            <span className="text-white/70">Priority Roadmap Access</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 border border-white/15 bg-white/[0.03] text-white/65">
            <Sparkles size={12} className="text-emerald-400" />
            7-day free trial
          </span>
          <span className="inline-flex rounded-full px-2.5 py-1 border border-white/15 bg-white/[0.03] text-white/65">
            Cancel anytime
          </span>
          <span className="inline-flex rounded-full px-2.5 py-1 border border-white/15 bg-white/[0.03] text-white/65">
            Checkout integration coming next
          </span>
        </div>

        <p className={`mt-3 text-[11px] ${theme === "dark" ? "text-white/45" : "text-slate-500"}`}>
          Preview only: payment and billing logic will be connected in the next step.
        </p>
      </div>
    </section>
  );
};

export default PricingPlans;
