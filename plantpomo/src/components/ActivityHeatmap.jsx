import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* ── Intensity levels ─────────────────────────────────────────────────────── */
const LEVELS = [
    {
        min: 0,
        label: "No focus",
        cell: "bg-white/[0.04] border border-white/[0.07]",
        dot: "bg-white/[0.04] border border-white/[0.07]",
    },
    {
        min: 1,
        label: "< 30m",
        cell: "bg-emerald-950 border border-emerald-900/60",
        dot: "bg-emerald-950 border border-emerald-900/60",
    },
    {
        min: 30,
        label: "30m+",
        cell: "bg-emerald-800/70",
        dot: "bg-emerald-800/70",
    },
    {
        min: 60,
        label: "1hr+",
        cell: "bg-emerald-500/80 shadow-[0_0_6px_rgba(52,211,153,0.35)]",
        dot: "bg-emerald-500/80",
    },
    {
        min: 120,
        label: "2hr+",
        cell: "bg-[#39ff14]/65 shadow-[0_0_8px_rgba(57,255,20,0.45)]",
        dot: "bg-[#39ff14]/65",
    },
    {
        min: 300,
        label: "5hr+",
        cell: "bg-[#39ff14] shadow-[0_0_14px_rgba(57,255,20,0.8),0_0_4px_rgba(57,255,20,0.5)]",
        dot: "bg-[#39ff14]",
    },
];

function getLevel(mins) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (mins >= LEVELS[i].min) return i;
    }
    return 0;
}

/* ── Date utilities ───────────────────────────────────────────────────────── */
function toYMD(date) {
    // Use local date parts to avoid UTC-offset shifting the displayed date
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * Build the full grid of days.
 * @param {string} todayYMD - "YYYY-MM-DD" string for today (used as memo key)
 * Always ends on the REAL today so the current month is never cut off.
 */
function buildGrid(todayYMD) {
    // Reconstruct today from the YMD string so we don't get DST creep
    const [y, mo, d] = todayYMD.split("-").map(Number);
    const today = new Date(y, mo - 1, d, 0, 0, 0, 0);

    // 365 days back from today (inclusive of today)
    const start = new Date(today);
    start.setDate(start.getDate() - 364);

    // Pad back to the Sunday that starts this week so columns align
    const padded = new Date(start);
    padded.setDate(padded.getDate() - padded.getDay()); // getDay() = 0 on Sunday

    const grid = [];
    const cur = new Date(padded);
    while (cur <= today) {
        grid.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return grid;
}

/** Collect month label + the week-column index it first appears in */
function monthLabels(days) {
    const seen = [];
    let lastMonth = -1;
    days.forEach((d, i) => {
        const m = d.getMonth();
        if (m !== lastMonth) {
            lastMonth = m;
            seen.push({
                col: Math.floor(i / 7),
                label: d.toLocaleString("default", { month: "short" }),
            });
        }
    });
    return seen;
}

function fmtMins(m) {
    if (m === 0) return "No focus";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Component ────────────────────────────────────────────────────────────── */
const ActivityHeatmap = ({ open, onClose, userId }) => {
    const [sessMap, setSessMap] = useState({});   // { "YYYY-MM-DD": minutes }
    const [loading, setLoading] = useState(false);
    const [tooltip, setTooltip] = useState(null); // { date, mins, rect }
    // Ref to the horizontal-scroll container — auto-scroll to the right so
    // today (the last column) is always fully visible when the panel opens.
    const scrollRef = useRef(null);

    // Compute today's local YMD once — used as the memo key so the grid
    // always reflects the REAL current day (handles midnight rollovers).
    const todayYMD = toYMD(new Date());

    const days = useMemo(() => buildGrid(todayYMD), [todayYMD]);
    const labels = useMemo(() => monthLabels(days), [days]);
    const numCols = Math.ceil(days.length / 7);

    // Pre-compute the earliest visible date string for the isPadded check
    const startYMD = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 364);
        return toYMD(d);
    }, [todayYMD]);

    /* fetch focus_sessions --------------------------------------------------- */
    const fetch = useCallback(async () => {
        if (!supabase || !userId) return;
        setLoading(true);
        const since = new Date();
        since.setDate(since.getDate() - 365);

        const { data, error } = await supabase
            .from("focus_sessions")
            .select("start_time, duration_seconds")
            .eq("user_id", userId)
            .gte("start_time", since.toISOString());

        if (!error && data) {
            const map = {};
            data.forEach(({ start_time, duration_seconds }) => {
                const d = start_time.slice(0, 10);
                map[d] = (map[d] || 0) + Math.round(duration_seconds / 60);
            });
            setSessMap(map);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (open) fetch();
    }, [open, fetch]);

    // Whenever the heatmap opens (or finishes loading), jump the scroll
    // container to its rightmost position so today is always in view.
    useEffect(() => {
        if (!open) return;
        requestAnimationFrame(() => {
            if (scrollRef.current)
                scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        });
    }, [open, loading]);   // re-run after loading finishes (grid re-renders)

    if (!open) return null;

    /* derived stats ---------------------------------------------------------- */
    // todayYMD is already declared above (used as memo key)
    const totalMins = Object.values(sessMap).reduce((a, b) => a + b, 0);
    const activeDays = Object.values(sessMap).filter((v) => v > 0).length;

    /* longest streak --------------------------------------------------------- */
    let streak = 0, best = 0, cur = 0;
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today0); d.setDate(d.getDate() - i);
        if (sessMap[toYMD(d)]) cur++; else cur = 0;
        if (cur > best) best = cur;
    }
    streak = best;

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-40" onClick={onClose}>
            {/* Card */}
            <div
                className="absolute bottom-[68px] left-6 rounded-2xl border border-white/10 bg-[#07090e]/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04),0_0_60px_rgba(57,255,20,0.03)]"
                style={{ width: "min(820px, calc(100vw - 48px))", padding: "20px 22px 18px" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header row */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
                            <h3 className="text-sm font-bold text-white/90 tracking-tight">Focus Activity</h3>
                        </div>
                        <p className="text-[11px] text-white/30 pl-4">Last 365 days</p>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-5 mr-2">
                        <div className="text-center">
                            <p className="text-base font-bold text-white/90">{fmtMins(totalMins)}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">Total focused</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-base font-bold text-white/90">{activeDays}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">Active days</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-base font-bold text-[#39ff14]">{streak}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">Best streak</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/30 hover:text-white/70"
                    >
                        <X size={14} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-[120px]">
                        <Loader2 size={18} className="animate-spin text-emerald-500/50" />
                    </div>
                ) : (
                    <>
                        {/* Grid area — scrolls horizontally; auto-jumps to today on open */}
                        <div ref={scrollRef} className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                            {/* minWidth ensures all columns render even if container clips them */}
                            <div className="flex gap-2" style={{ minWidth: numCols * 13 + 32 }}>

                                {/* Day-of-week labels */}
                                <div className="flex flex-col shrink-0 pt-[22px]" style={{ gap: 3 }}>
                                    {DAY_LABELS.map((d, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-end"
                                            style={{ height: 10, width: 24 }}
                                        >
                                            {i % 2 === 1 && (
                                                <span className="text-[9px] text-white/25 font-medium">{d}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Month labels + cells */}
                                <div className="flex-1">
                                    {/* Month row */}
                                    <div
                                        className="relative h-[22px] mb-0"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: `repeat(${numCols}, 10px)`,
                                            gap: "3px",
                                        }}
                                    >
                                        {labels.map(({ col, label }, i) => (
                                            <span
                                                key={i}
                                                className="absolute text-[9px] text-white/30 font-medium whitespace-nowrap"
                                                style={{ left: col * 13 }}
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Cell grid */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateRows: "repeat(7, 10px)",
                                            gridAutoFlow: "column",
                                            gridAutoColumns: "10px",
                                            gap: "3px",
                                        }}
                                    >
                                        {days.map((day, idx) => {
                                            const ymd = toYMD(day);
                                            const future = ymd > todayYMD;
                                            const isPadded = ymd < startYMD;
                                            const mins = sessMap[ymd] || 0;
                                            const lvl = LEVELS[getLevel(mins)];
                                            const isToday = ymd === todayYMD;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`rounded-sm transition-all duration-100 cursor-default
                            ${future || isPadded ? "opacity-0 pointer-events-none" : lvl.cell}
                            ${isToday ? "ring-1 ring-white/40 ring-offset-[1px] ring-offset-transparent" : ""}
                            hover:brightness-[1.6] hover:scale-[1.4] hover:z-10
                          `}
                                                    onMouseEnter={(e) => {
                                                        if (!future && !isPadded) {
                                                            setTooltip({ date: day, mins, el: e.currentTarget });
                                                        }
                                                    }}
                                                    onMouseLeave={() => setTooltip(null)}
                                                    style={{ position: "relative" }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-white/[0.06]">
                            <span className="text-[10px] text-white/25 mr-1">Less</span>
                            {LEVELS.map((lvl, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className={`w-[10px] h-[10px] rounded-[2px] shrink-0 ${lvl.dot}`} />
                                    {i > 0 && (
                                        <span className="text-[10px] text-white/30">{lvl.label}</span>
                                    )}
                                    {i < LEVELS.length - 1 && i > 0 && (
                                        <span className="text-white/10 text-[10px]">·</span>
                                    )}
                                </div>
                            ))}
                            <span className="text-[10px] text-white/25 ml-1">More</span>
                        </div>
                    </>
                )}
            </div>

            {/* Floating tooltip */}
            {tooltip && (() => {
                const rect = tooltip.el?.getBoundingClientRect?.();
                if (!rect) return null;
                const cx = rect.left + rect.width / 2;
                const top = rect.top - 44;
                return (
                    <div
                        className="fixed z-50 pointer-events-none"
                        style={{ left: cx, top, transform: "translateX(-50%)" }}
                    >
                        <div className="bg-[#0d1117]/95 border border-white/15 rounded-lg px-3 py-1.5 text-[11px] shadow-2xl whitespace-nowrap backdrop-blur-xl">
                            <span className="text-white/50">
                                {tooltip.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <span
                                className={`ml-2 font-semibold ${tooltip.mins > 0 ? "text-emerald-400" : "text-white/25"}`}
                            >
                                {fmtMins(tooltip.mins)}
                            </span>
                        </div>
                        {/* Caret */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                            style={{
                                borderLeft: "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop: "5px solid rgba(255,255,255,0.15)",
                            }}
                        />
                    </div>
                );
            })()}
        </div>
    );
};

export default ActivityHeatmap;
