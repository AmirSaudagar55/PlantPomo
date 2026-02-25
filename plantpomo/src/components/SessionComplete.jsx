import React, { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Web Audio chime — synthesised, no external files, self-cleans
───────────────────────────────────────────────────────────────*/
function playCompletionChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Ascending C-major arpeggio: C5 E5 G5 C6
        const NOTES = [523.25, 659.25, 783.99, 1046.5];
        NOTES.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.18;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 1.1);
        });

        // Final shimmering chord (softer, delayed)
        [523.25, 659.25, 783.99].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + NOTES.length * 0.18 + 0.05;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.08, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 1.6);
        });

        // Free AudioContext after all notes finish
        setTimeout(() => { try { ctx.close(); } catch (_) { } }, 4000);
    } catch (_) {
        // AudioContext blocked or unsupported — silently skip
    }
}

/* ─────────────────────────────────────────────────────────────
   Leaf SVG — a simple organic leaf path
───────────────────────────────────────────────────────────────*/
const LeafSVG = ({ color }) => (
    <svg viewBox="0 0 24 24" fill={color} style={{ width: "100%", height: "100%" }}>
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2C18 8 17 8 17 8z" />
    </svg>
);

/* ─────────────────────────────────────────────────────────────
   Leaf config — generated once per mount (stable ref)
───────────────────────────────────────────────────────────────*/
const LEAF_COLORS = [
    "#4ade80", "#86efac", "#6ee7b7", "#34d399",
    "#a7f3d0", "#fbbf24", "#fb923c", "#f87171",
];
const NUM_LEAVES = 22;

function makeLeaves() {
    return Array.from({ length: NUM_LEAVES }, (_, i) => ({
        id: i,
        left: Math.random() * 100,                          // vw %
        size: 14 + Math.random() * 18,                     // px
        duration: 2.8 + Math.random() * 2.2,                   // s fall time
        delay: Math.random() * 1.4,                          // s stagger
        rot: Math.floor(Math.random() * 360),              // deg start rotation
        sway: Math.round((Math.random() - 0.5) * 220),     // px horizontal drift
        color: LEAF_COLORS[i % LEAF_COLORS.length],
    }));
}

/* ─────────────────────────────────────────────────────────────
   CSS injected once (idempotent via <style> tag with id)
───────────────────────────────────────────────────────────────*/
const STYLE_ID = "session-complete-styles";
const STYLES = `
  @keyframes sc-leaf-fall {
    0%   { opacity: 0; transform: translateY(-50px) rotate(var(--sc-rot)) translateX(0px); }
    8%   { opacity: 1; }
    85%  { opacity: 0.9; }
    100% { opacity: 0; transform: translateY(105vh) rotate(calc(var(--sc-rot) + 380deg)) translateX(var(--sc-sway)); }
  }
  @keyframes sc-toast-in  { from { opacity:0; transform: translateY(24px) scale(0.88); } to { opacity:1; transform:none; } }
  @keyframes sc-toast-out { to   { opacity:0; transform: translateY(-12px) scale(0.94); } }
  @keyframes sc-glow-pulse {
    0%, 100% { box-shadow: 0 0 24px rgba(52,211,153,0.18), 0 8px 40px rgba(0,0,0,0.5); }
    50%       { box-shadow: 0 0 48px rgba(52,211,153,0.32), 0 8px 50px rgba(0,0,0,0.5); }
  }
`;

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = STYLES;
    document.head.appendChild(tag);
}

/* ─────────────────────────────────────────────────────────────
   SessionComplete
   Props: onDone() — called after animation finishes (~3.8 s)
───────────────────────────────────────────────────────────────*/
const SessionComplete = ({ onDone }) => {
    const [phase, setPhase] = useState("in"); // "in" | "out"
    const leaves = useRef(makeLeaves()).current;

    useEffect(() => {
        ensureStyles();
        playCompletionChime();

        // Start fade-out at 3.1 s, call onDone at 3.6 s
        const t1 = setTimeout(() => setPhase("out"), 3100);
        const t2 = setTimeout(() => { try { onDone?.(); } catch (_) { } }, 3600);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {/* ── LEAVES ── fixed overlay, pointer-events none, GPU composited */}
            <div
                aria-hidden="true"
                style={{
                    position: "fixed", inset: 0,
                    zIndex: 1000,
                    pointerEvents: "none",
                    overflow: "hidden",
                }}
            >
                {leaves.map((leaf) => (
                    <div
                        key={leaf.id}
                        style={{
                            position: "absolute",
                            left: `${leaf.left}%`,
                            top: "-50px",
                            width: leaf.size,
                            height: leaf.size,
                            willChange: "transform, opacity",
                            "--sc-rot": `${leaf.rot}deg`,
                            "--sc-sway": `${leaf.sway}px`,
                            animation: `sc-leaf-fall ${leaf.duration}s ${leaf.delay}s ease-in both`,
                        }}
                    >
                        <LeafSVG color={leaf.color} />
                    </div>
                ))}
            </div>

            {/* ── TOAST ── centred, pointer-events none */}
            <div
                aria-live="polite"
                style={{
                    position: "fixed", inset: 0,
                    zIndex: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        animation: phase === "in"
                            ? "sc-toast-in 0.45s cubic-bezier(.22,1,.36,1) forwards, sc-glow-pulse 2s 0.5s ease-in-out infinite"
                            : "sc-toast-out 0.5s ease forwards",
                        background: "linear-gradient(145deg, rgba(5,8,12,0.82), rgba(10,16,24,0.88))",
                        border: "1px solid rgba(52,211,153,0.20)",
                        borderRadius: "28px",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        padding: "28px 40px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: "240px",
                    }}
                >
                    {/* Leaf burst emoji cluster */}
                    <div style={{ fontSize: "48px", lineHeight: 1, userSelect: "none" }}>🌿</div>
                    <p style={{
                        margin: 0,
                        color: "#e6ffe6",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                    }}>
                        Session Complete!
                    </p>
                    <p style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.38)",
                        fontSize: "13px",
                        fontWeight: 400,
                    }}>
                        Great work — take a breath 🍃
                    </p>

                    {/* Thin green progress bar — decorative */}
                    <div style={{
                        width: "100%",
                        height: "2px",
                        borderRadius: "9999px",
                        background: "rgba(255,255,255,0.06)",
                        marginTop: "6px",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            borderRadius: "9999px",
                            background: "linear-gradient(90deg, #34d399, #6ee7b7)",
                            animation: `sc-toast-in 3.1s linear both`,
                            width: "100%",
                            transformOrigin: "left",
                            transform: "scaleX(0)",
                            animationName: "none",
                            // simple shrink bar
                            transition: "none",
                        }} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default SessionComplete;
