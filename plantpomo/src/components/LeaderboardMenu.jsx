import React, { useRef } from "react";
import { Trophy, Flame, Sparkles, RefreshCw, Crown } from "lucide-react";
import { useLeaderboard } from "../lib/useLeaderboard";

const LIMIT = 50;

/* ── Rank styles ─────────────────────────────────────────────────────────── */
const RANK_CONFIG = {
    1: { label: "1st", bg: "bg-amber-400/10", border: "border-amber-400/30", text: "text-amber-300", shadow: "shadow-[0_0_16px_rgba(251,191,36,0.15)]", badge: "bg-amber-400/20 text-amber-300 border-amber-400/40" },
    2: { label: "2nd", bg: "bg-slate-400/8", border: "border-slate-400/25", text: "text-slate-300", shadow: "shadow-[0_0_10px_rgba(148,163,184,0.1)]", badge: "bg-slate-400/15 text-slate-300 border-slate-400/30" },
    3: { label: "3rd", bg: "bg-orange-700/8", border: "border-orange-600/25", text: "text-orange-400", shadow: "shadow-[0_0_10px_rgba(194,65,12,0.12)]", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
};

function rankLabel(n) {
    if (n === 1) return "🥇";
    if (n === 2) return "🥈";
    if (n === 3) return "🥉";
    return `#${n}`;
}

/* ── Duration formatter ─────────────────────────────────────────────────── */
function fmtMins(mins) {
    if (!mins) return "0m";
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ url, name, premium, size = 32 }) {
    const initial = (name || "?")[0].toUpperCase();
    return (
        <div
            className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs
                ${premium
                    ? "ring-2 ring-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    : "ring-1 ring-white/10"
                }`}
            style={{ width: size, height: size }}
        >
            {url
                ? <img src={url} alt={name} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                : <span className={premium ? "text-amber-200" : "text-white/60"} style={{ fontSize: size * 0.4 }}>{initial}</span>
            }
            {/* Premium crown overlay */}
            {premium && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400/90 flex items-center justify-center">
                    <Crown size={8} className="text-black" />
                </div>
            )}
        </div>
    );
}

/* ── Single leaderboard row ─────────────────────────────────────────────── */
function LeaderboardRow({ entry, rank, isMe }) {
    const rc = RANK_CONFIG[rank];
    const isPremium = entry.is_premium;

    return (
        <div
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                ${rc ? `${rc.bg} ${rc.border} ${rc.shadow}` : isMe
                    ? "bg-emerald-500/8 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.08)]"
                    : "bg-white/[0.025] border-white/[0.05] hover:bg-white/[0.04]"
                }
                ${isPremium && !rc ? "bg-amber-400/4 border-amber-400/15" : ""}
            `}
        >
            {/* Premium background shimmer (only rows 4+) */}
            {isPremium && !rc && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 animate-pulse" />
                </div>
            )}

            {/* Rank badge */}
            <span className={`shrink-0 w-8 text-center text-sm font-bold tabular-nums ${rc ? rc.text : isMe ? "text-emerald-400" : "text-white/35"}`}>
                {rankLabel(rank)}
            </span>

            {/* Avatar */}
            <Avatar
                url={entry.avatar_url}
                name={entry.full_name}
                premium={isPremium}
                size={30}
            />

            {/* Name + premium label */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-xs font-semibold truncate ${isMe ? "text-emerald-300" : rc ? rc.text : isPremium ? "text-amber-200/80" : "text-white/75"}`}>
                        {entry.full_name || "Anonymous"}
                        {isMe && <span className="ml-1 text-[9px] text-emerald-400/60 font-normal">(you)</span>}
                    </span>
                    {isPremium && (
                        <Sparkles size={10} className="text-amber-400 shrink-0 animate-pulse" />
                    )}
                </div>
                {/* Streak */}
                {(entry.current_streak ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                        <Flame size={9} className="text-orange-400/60" />
                        <span className="text-[9px] text-white/25">{entry.current_streak}d</span>
                    </div>
                )}
            </div>

            {/* Weekly minutes */}
            <div className="shrink-0 text-right">
                <span className={`text-xs font-black tabular-nums ${rc ? rc.text : isMe ? "text-emerald-400" : "text-white/50"}`}>
                    {fmtMins(entry.weekly_focus_minutes)}
                </span>
            </div>
        </div>
    );
}

/* ── Main component ──────────────────────────────────────────────────────── */
const LeaderboardMenu = ({ currentUserId, open, onClose }) => {
    const { entries, loading, myRank, currentWeekStart, refetch } = useLeaderboard(currentUserId);
    const menuRef = useRef(null);


    // Human-readable week label — always computed so it's available even when hidden
    const startDate = new Date(currentWeekStart + "T00:00:00");
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekLabel = `${fmt(startDate)} – ${fmt(endDate)}`;

    // When closed, render nothing visible but keep hook alive via early fragment
    if (!open) return <></>;

    return (
        <>
            {/* ── Blurred full-screen backdrop (same as TodoList) ─────────── */}
            <div
                className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* ── Panel — fixed, top-right, just below Navbar ─────────────── */}
            <div
                ref={menuRef}
                onClick={e => e.stopPropagation()}
                className="fixed top-[64px] right-4 z-[56] w-[340px] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)]"
                style={{ maxHeight: "calc(100vh - 80px)" }}
            >
                {/* Gold top glow strip */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none" />

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="bg-[#07090e]/97 backdrop-blur-2xl px-4 pt-4 pb-3 shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                            <Trophy size={13} className="text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white tracking-tight">Weekly Leaderboard</p>
                            <p className="text-[10px] text-white/30">{weekLabel}</p>
                        </div>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"
                        >
                            ✕
                        </button>
                        <button
                            onClick={() => refetch()}
                            title="Refresh"
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/70 flex items-center justify-center transition-all"
                        >
                            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* My rank bar */}
                    {myRank && (
                        <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-400/15">
                            <span className="text-[10px] text-white/40">Your rank this week:</span>
                            <span className="text-[11px] font-black text-emerald-400 tabular-nums">#{myRank}</span>
                            <span className="ml-auto text-[10px] text-emerald-400/60 tabular-nums">
                                {fmtMins(entries.find(e => e.id === currentUserId)?.weekly_focus_minutes ?? 0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── List ────────────────────────────────────────────────── */}
                <div
                    className="flex-1 bg-[#07090e]/97 backdrop-blur-2xl px-3 pb-3 flex flex-col gap-1.5 lb-scroll"
                    style={{ overflowY: "auto", minHeight: 0, overscrollBehavior: "contain" }}
                >
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                                <p className="text-[11px] text-white/30">Loading leaderboard…</p>
                            </div>
                        </div>
                    )}

                    {!loading && entries.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <Trophy size={32} className="text-amber-400/20" />
                            <p className="text-xs text-white/30 font-medium">No sessions recorded this week yet.</p>
                            <p className="text-[10px] text-white/20">Start a focus session to claim the #1 spot!</p>
                        </div>
                    )}

                    {!loading && entries.map((entry, idx) => (
                        <LeaderboardRow
                            key={entry.id}
                            entry={entry}
                            rank={idx + 1}
                            isMe={entry.id === currentUserId}
                        />
                    ))}
                </div>

                {/* ── Footer ──────────────────────────────────────────────── */}
                <div className="shrink-0 bg-[#07090e]/97 backdrop-blur-2xl px-4 py-2.5 border-t border-white/[0.04]">
                    <p className="text-center text-[9px] text-white/20">
                        🔴 Live · Resets every Monday · Top {LIMIT} users shown
                    </p>
                </div>

                <style>{`
                    .lb-scroll::-webkit-scrollbar { width: 4px; }
                    .lb-scroll::-webkit-scrollbar-track { background: transparent; }
                    .lb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 9999px; }
                    .lb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(251,191,36,0.2); }
                `}</style>
            </div>
        </>
    );
};

// LIMIT is exported for reference if needed elsewhere
export { LIMIT as LEADERBOARD_LIMIT };
export default LeaderboardMenu;
