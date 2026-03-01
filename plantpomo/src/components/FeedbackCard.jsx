/**
 * FeedbackCard.jsx
 *
 * Custom-styled feedback form that posts silently to the Google Form.
 * Form action: https://docs.google.com/forms/d/e/1FAIpQLSfMbwZ6CMV6jo_-mx7A3HZqfcJHkaXnlXX1zvqV5TVnxahe1w/formResponse
 *
 * Field map:
 *   entry.1591633300  → Feedback type  (Comments | Bug Report | Feature Request | Praise)
 *   entry.326955045   → Q1 (context-dependent label, star or text)
 *   entry.1696159737  → Q2 (context-dependent label)
 *   entry.485428648   → Q3 (details / description)
 *   entry.879531967   → Q4 Email (optional)
 *
 * Strategy: hidden <iframe target> so the page never navigates away.
 */

import React, { useCallback, useRef, useState } from "react";
import {
    X, Star, Send, CheckCircle2, MessageSquarePlus,
    Bug, Lightbulb, Heart,
} from "lucide-react";

const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLSfMbwZ6CMV6jo_-mx7A3HZqfcJHkaXnlXX1zvqV5TVnxahe1w/formResponse";

/* ── Feedback types with context-aware question sets ─────────────────────── */
const TYPES = [
    {
        value: "Comments",
        label: "Comment",
        icon: MessageSquarePlus,
        color: "text-sky-400",
        bg: "bg-sky-500/15 border-sky-500/30",
        q1Label: "Overall experience",
        q1Type: "stars",
        q2Label: "What do you like most?",
        q2Placeholder: "e.g. The garden, timer, leaderboard…",
        q3Label: "Anything else you'd like to share?",
        q3Placeholder: "Additional comments, suggestions or thoughts…",
    },
    {
        value: "Bug Report",
        label: "Bug",
        icon: Bug,
        color: "text-red-400",
        bg: "bg-red-500/15 border-red-500/30",
        q1Label: "Severity",
        q1Type: "severity",      // low / medium / high / critical
        q2Label: "Where did the bug occur?",
        q2Placeholder: "e.g. Garden page, Focus timer, Leaderboard…",
        q3Label: "Steps to reproduce & what happened",
        q3Placeholder: "1. Go to …\n2. Click …\n3. Expected: … Got: …",
    },
    {
        value: "Feature Request",
        label: "Feature",
        icon: Lightbulb,
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-500/30",
        q1Label: "How important is this to you?",
        q1Type: "stars",
        q2Label: "Feature summary",
        q2Placeholder: "e.g. Dark-mode calendar, export sessions to CSV…",
        q3Label: "Why would this help you?",
        q3Placeholder: "Describe the problem it would solve or the workflow it would improve…",
    },
    {
        value: "Praise",
        label: "Praise 🌱",
        icon: Heart,
        color: "text-pink-400",
        bg: "bg-pink-500/15 border-pink-500/30",
        q1Label: "How happy are you with PlantPomo?",
        q1Type: "stars",
        q2Label: "What made your day?",
        q2Placeholder: "Tell us what you love — your words motivate the team!",
        q3Label: "Anything you'd tweak?",
        q3Placeholder: "Even a 5-star experience could be 6 stars… what would get you there?",
    },
];

const STAR_LABELS = ["", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"];
const SEVERITY_OPTS = ["Low", "Medium", "High", "Critical"];
const SEVERITY_COLORS = {
    Low: "bg-green-500/15 border-green-500/30 text-green-400",
    Medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    High: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    Critical: "bg-red-500/15 border-red-500/30 text-red-400",
};

const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 " +
    "focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none";

export default function FeedbackCard({ open, onClose }) {
    const iframeRef = useRef(null);
    const formRef = useRef(null);

    const [typeIdx, setTypeIdx] = useState(0);
    const [stars, setStars] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [severity, setSeverity] = useState("");
    const [q2, setQ2] = useState("");
    const [q3, setQ3] = useState("");
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);

    const currentType = TYPES[typeIdx];
    const isBug = currentType.value === "Bug Report";

    const reset = useCallback(() => {
        setTypeIdx(0); setStars(0); setHovered(0); setSeverity("");
        setQ2(""); setQ3(""); setEmail(""); setSending(false); setDone(false);
    }, []);

    const handleClose = () => { reset(); onClose(); };

    // q1 value depends on type
    const q1Value = isBug ? severity : (stars > 0 ? STAR_LABELS[stars] : "");
    const q1Valid = isBug ? severity !== "" : stars > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!q1Valid) return;
        setSending(true);
        formRef.current.submit();
        setTimeout(() => { setSending(false); setDone(true); }, 1500);
    };

    if (!open) return null;

    const displayStars = hovered || stars;

    return (
        <>
            {/* Hidden iframe absorbs the Google Form redirect */}
            <iframe
                ref={iframeRef}
                name="feedback-sink"
                title="feedback-sink"
                style={{ display: "none" }}
                aria-hidden="true"
            />

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            >
                {/* Card */}
                <div
                    className="relative w-full max-w-lg rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(57,255,20,0.06),0_0_120px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
                    style={{ background: "linear-gradient(160deg, rgba(8,14,10,0.98) 0%, rgba(4,8,6,0.99) 100%)" }}
                >
                    {/* Neon top glow line */}
                    <div
                        className="sticky top-0 left-0 right-0 h-px rounded-full z-10"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.45), transparent)" }}
                    />

                    {/* Close */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all z-10"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>

                    {/* ── Success ── */}
                    {done ? (
                        <div className="flex flex-col items-center justify-center px-8 py-16 text-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white mb-1">Thank you! 🌱</p>
                                <p className="text-sm text-white/50">Your feedback helps PlantPomo grow.</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="mt-2 px-6 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form
                            ref={formRef}
                            action={FORM_ACTION}
                            method="POST"
                            target="feedback-sink"
                            onSubmit={handleSubmit}
                            className="px-6 py-6 flex flex-col gap-5"
                        >
                            {/* Hidden fields */}
                            <input type="hidden" name="entry.1591633300" value={currentType.value} />
                            <input type="hidden" name="entry.326955045" value={q1Value} />

                            {/* Header */}
                            <div className="flex items-center gap-3 pr-8">
                                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <MessageSquarePlus size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">Share your feedback</h2>
                                    <p className="text-[11px] text-white/40">Help us build a better PlantPomo</p>
                                </div>
                            </div>

                            {/* ── Type selector ── */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Category</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {TYPES.map(({ value, label, icon: Icon, color, bg }, idx) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => { setTypeIdx(idx); setStars(0); setSeverity(""); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${typeIdx === idx
                                                    ? `${bg} ${color}`
                                                    : "bg-white/5 border-white/10 text-white/35 hover:bg-white/10 hover:text-white/60"
                                                }`}
                                        >
                                            <Icon size={11} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Q1 ── */}
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                                    {currentType.q1Label} <span className="text-red-400">*</span>
                                </span>

                                {/* Star rating (for non-bug types) */}
                                {!isBug && (
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onMouseEnter={() => setHovered(s)}
                                                onMouseLeave={() => setHovered(0)}
                                                onClick={() => setStars(s)}
                                                className="transition-transform hover:scale-125 focus:outline-none"
                                                aria-label={`${s} star${s > 1 ? "s" : ""}`}
                                            >
                                                <Star
                                                    size={26}
                                                    className={`transition-colors ${s <= displayStars ? "text-amber-400 fill-amber-400" : "text-white/15"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                        {displayStars > 0 && (
                                            <span className="text-[11px] text-amber-400/70 font-medium ml-1">
                                                {displayStars}/5
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Severity picker (for bug reports) */}
                                {isBug && (
                                    <div className="flex gap-2 flex-wrap">
                                        {SEVERITY_OPTS.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSeverity(s)}
                                                className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${severity === s
                                                        ? SEVERITY_COLORS[s]
                                                        : "bg-white/5 border-white/10 text-white/35 hover:bg-white/10"
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!q1Valid && (
                                    <p className="text-[10px] text-white/25">
                                        {isBug ? "Select a severity level" : "Click a star to rate"}
                                    </p>
                                )}
                            </div>

                            {/* ── Q2 ── */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="fb-q2" className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                                    {currentType.q2Label}
                                </label>
                                <input
                                    id="fb-q2"
                                    name="entry.1696159737"
                                    type="text"
                                    value={q2}
                                    onChange={(e) => setQ2(e.target.value)}
                                    placeholder={currentType.q2Placeholder}
                                    className={inputCls}
                                    maxLength={200}
                                />
                            </div>

                            {/* ── Q3 ── */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="fb-q3" className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                                    {currentType.q3Label}
                                </label>
                                <textarea
                                    id="fb-q3"
                                    name="entry.485428648"
                                    value={q3}
                                    onChange={(e) => setQ3(e.target.value)}
                                    placeholder={currentType.q3Placeholder}
                                    rows={3}
                                    className={inputCls}
                                    maxLength={1000}
                                />
                                <span className="text-[10px] text-white/20 text-right">{q3.length}/1000</span>
                            </div>

                            {/* ── Email ── */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="fb-email" className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                                    Email <span className="text-white/20 font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    id="fb-email"
                                    name="entry.879531967"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className={inputCls}
                                />
                            </div>

                            {/* ── Submit ── */}
                            <button
                                type="submit"
                                disabled={!q1Valid || sending}
                                className={[
                                    "flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all",
                                    !q1Valid || sending
                                        ? "opacity-40 cursor-not-allowed bg-white/5 border border-white/10 text-white/50"
                                        : "bg-gradient-to-r from-emerald-600/80 to-emerald-500/70 border border-emerald-400/30 text-white hover:from-emerald-500/90 hover:to-emerald-400/80 shadow-[0_0_20px_rgba(57,255,20,0.12)] hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]",
                                ].join(" ")}
                            >
                                {sending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} />
                                        Send Feedback
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-white/15 text-center">
                                Submitted securely to our private form — used only for product improvement.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
