import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlantProgress from "./PlantProgress";
import PlantShopSidebar from "./PlantShopSidebar";
import { plants } from "./tilesData";
import SessionComplete from "./SessionComplete";
import { supabase } from "../lib/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────*/
const DEFAULT_FOCUS_MINUTES = 30;
const MIN_SESSION_SECONDS = 60; // Edge Case 5: minimum to count as "completed"

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const LS_KEY = "plantpomo_timer_state";

/* ─────────────────────────────────────────────────────────────
   localStorage helpers
───────────────────────────────────────────────────────────────*/
function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) { }
}
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (_) { return null; }
}
function clearSavedState() {
  try { localStorage.removeItem(LS_KEY); } catch (_) { }
}

/* ─────────────────────────────────────────────────────────────
   Format helpers
───────────────────────────────────────────────────────────────*/
function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

/* ─────────────────────────────────────────────────────────────
   SVG Icons (inline, no extra dep)
───────────────────────────────────────────────────────────────*/
const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Confirmation Dialog (small inline modal)
───────────────────────────────────────────────────────────────*/
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <button
      type="button"
      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      aria-label="Cancel"
      onClick={onCancel}
    />
    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-[#0d1117]/95 p-5 shadow-2xl">
      <p className="text-sm text-white/80 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1.5 text-xs rounded-md border border-white/20 text-white/60 hover:bg-white/10"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs rounded-md bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
          onClick={onConfirm}
        >
          Discard & Switch
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   FocusCard
───────────────────────────────────────────────────────────────*/
/**
 * Props (all optional – falls back to offline/local mode if not given):
 *   profile         – from useProfile()
 *   refetchProfile  – from useProfile()
 *   ownedPlantIds   – Set<string> from useInventory()
 *   ownedLandIds    – Set<string> from useInventory()
 *   onBuyItem       – async fn from useInventory()
 */
const FocusCard = ({
  profile = null,
  refetchProfile,
  ownedPlantIds = new Set(["sprout", "flower", "carnation", "lavander", "sakura"]),
  ownedLandIds = new Set(["meadow"]),
  onBuyItem,
}) => {
  /* ── Persistent settings ── */
  const [pomodoroSettings, setPomodoroSettings] = useState(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);

  /* ── Mode & phase ── */
  const [mode, setMode] = useState("stopwatch"); // 'pomodoro' | 'stopwatch'
  const [phase, setPhase] = useState("focus");   // 'focus' | 'shortBreak' | 'longBreak'

  /* ── Run state machine: 'idle' | 'running' | 'paused' ── */
  const [runState, setRunState] = useState("idle");

  /*
   * Timestamp-based approach (Edge Case 1 – Background Throttling):
   *   - accumulatedMs: confirmed elapsed time before the current run started (from prior pauses)
   *   - startTs: Date.now() at the moment the user hit Play/Resume
   *
   * Pomodoro display = phaseDuration - (accumulatedMs + (Date.now() - startTs))
   * Stopwatch display = accumulatedMs + (Date.now() - startTs)
   */
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [startTs, setStartTs] = useState(null);

  /* Pomodoro phase total duration (ms) */
  const [phaseDurationMs, setPhaseDurationMs] = useState(DEFAULT_FOCUS_MINUTES * 60 * 1000);

  /* ── Session counters ── */
  const [completedSessions, setCompletedSessions] = useState(0);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(0);

  /* ── UI state ── */
  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [selectedTile, setSelectedTile] = useState(() => plants.find((p) => ownedPlantIds.has(p.id)) ?? plants[0]);

  /* Ticker for re-render every 250 ms (lightweight) */
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  /* ─── Derived display values ─── */
  const elapsedMs = useMemo(() => {
    const running = runState === "running" && startTs !== null ? Date.now() - startTs : 0;
    return accumulatedMs + running;
  }, [runState, startTs, accumulatedMs, tick]); // tick forces recalc

  const displaySeconds = useMemo(() => {
    if (mode === "stopwatch") return Math.floor(elapsedMs / 1000);
    return Math.max(0, Math.floor((phaseDurationMs - elapsedMs) / 1000));
  }, [mode, elapsedMs, phaseDurationMs]);

  const formattedTime = useMemo(() => formatSeconds(displaySeconds), [displaySeconds]);

  const timerProgress = useMemo(() => {
    if (mode === "stopwatch") return 0; // no ring fill in stopwatch
    if (phaseDurationMs <= 0) return 0;
    return Math.min(100, (elapsedMs / phaseDurationMs) * 100);
  }, [mode, elapsedMs, phaseDurationMs]);

  const growthProgress = useMemo(() => Math.min(100, completedSessions * 20), [completedSessions]);

  const phaseLabel = useMemo(() => {
    if (mode === "stopwatch") return "Stopwatch";
    if (phase === "shortBreak") return "Short Break";
    if (phase === "longBreak") return "Long Break";
    return "Focus";
  }, [mode, phase]);

  const isSessionActive = runState === "running" || (runState === "paused" && accumulatedMs > 0);
  const isSessionLocked = isSessionActive;

  /* ─── Ticker — start/stop interval based on runState ─── */
  useEffect(() => {
    if (runState === "running") {
      intervalRef.current = window.setInterval(() => setTick((t) => t + 1), 250);
    } else {
      window.clearInterval(intervalRef.current);
    }
    return () => window.clearInterval(intervalRef.current);
  }, [runState]);

  /* ─── Broadcast the active plant to Index › TodoList ─── */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("focus:tile:change", { detail: { plantId: selectedTile?.id ?? null } })
    );
  }, [selectedTile?.id]);


  /* ─── Auto-advance Pomodoro when countdown hits 0 ─── */
  useEffect(() => {
    if (mode !== "pomodoro" || runState !== "running") return;
    if (displaySeconds <= 0) {
      handlePomodoroPhaseEnd();
    }
  }, [displaySeconds, mode, runState]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Persist state to localStorage (Edge Case 4) ─── */
  useEffect(() => {
    if (runState === "idle" && accumulatedMs === 0) {
      clearSavedState();
      return;
    }
    saveState({ mode, phase, runState, accumulatedMs, startTs, phaseDurationMs, pomodoroSettings, focusSessionsCompleted, completedSessions });
  }, [mode, phase, runState, accumulatedMs, startTs, phaseDurationMs, pomodoroSettings, focusSessionsCompleted, completedSessions]);

  /* ─── Hydrate from localStorage on mount (Edge Case 4) ─── */
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    // Recalculate accumulated time if it was running when page closed
    let rehydratedAccumulatedMs = saved.accumulatedMs;
    if (saved.runState === "running" && saved.startTs) {
      rehydratedAccumulatedMs += Date.now() - saved.startTs;
    }
    setMode(saved.mode ?? "stopwatch");
    setPhase(saved.phase ?? "focus");
    setAccumulatedMs(rehydratedAccumulatedMs);
    setPhaseDurationMs(saved.phaseDurationMs ?? DEFAULT_FOCUS_MINUTES * 60 * 1000);
    setPomodoroSettings(saved.pomodoroSettings ?? DEFAULT_SETTINGS);
    setDraftSettings(saved.pomodoroSettings ?? DEFAULT_SETTINGS);
    setFocusSessionsCompleted(saved.focusSessionsCompleted ?? 0);
    setCompletedSessions(saved.completedSessions ?? 0);
    // Restore run state: if it was running, re-start from now with the recalculated accumulated
    if (saved.runState === "running") {
      setStartTs(Date.now());
      setRunState("running");
    } else if (saved.runState === "paused") {
      setRunState("paused");
      setStartTs(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Shop open via global event ─── */
  useEffect(() => {
    const handler = () => { if (!isSessionLocked) setShopOpen(true); };
    window.addEventListener("shop:open", handler);
    return () => window.removeEventListener("shop:open", handler);
  }, [isSessionLocked]);

  /* ─── music:timer:set event ─── */
  useEffect(() => {
    const onTimerSet = (e) => {
      const mins = Number(e?.detail?.mins);
      if (!Number.isNaN(mins) && mins > 0) {
        resetToIdle(() => {
          setMode("pomodoro");
          setPhase("focus");
          setPhaseDurationMs(Math.max(1, Math.floor(mins * 60)) * 1000);
        });
      }
    };
    window.addEventListener("music:timer:set", onTimerSet);
    return () => window.removeEventListener("music:timer:set", onTimerSet);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────────────────────────────────────────────────────────
     Core helpers
  ───────────────────────────────────────────────────────────────*/

  /** Hard-reset all running timer state, then optionally run a callback for additional state updates */
  const resetToIdle = useCallback((extraUpdates) => {
    window.clearInterval(intervalRef.current);
    setRunState("idle");
    setStartTs(null);
    setAccumulatedMs(0);
    clearSavedState();
    if (extraUpdates) extraUpdates();
  }, []);

  const getPhaseDurationMs = useCallback((p, settings) => {
    if (p === "shortBreak") return settings.shortBreakDuration * 60 * 1000;
    if (p === "longBreak") return settings.longBreakDuration * 60 * 1000;
    return settings.focusDuration * 60 * 1000;
  }, []);

  /**
   * Persist a completed focus session to Supabase via the complete_focus_session RPC.
   * Silently no-ops if Supabase is not configured or user is not logged in.
   */
  const recordSessionToSupabase = useCallback(async (elapsedMs, sessionMode) => {
    if (!supabase) return;
    const durationSeconds = Math.floor(elapsedMs / 1000);
    if (durationSeconds < MIN_SESSION_SECONDS) return;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - elapsedMs);
    try {
      await supabase.rpc("complete_focus_session", {
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_duration_seconds: durationSeconds,
        p_plant_id: selectedTile?.id ?? null,
        p_land_id: null,
        p_mode: sessionMode,
        p_build_time_mins: selectedTile?.buildTime ?? 25,
      });
      refetchProfile?.();
    } catch (_) {
      // Non-blocking: local state already updated
    }
  }, [selectedTile, refetchProfile]);

  /** Called when a Pomodoro phase naturally expires (timer hits 0) */
  const handlePomodoroPhaseEnd = useCallback(() => {
    const elapsed = phaseDurationMs; // the full phase was consumed
    window.clearInterval(intervalRef.current);
    setRunState("idle");
    setStartTs(null);
    setAccumulatedMs(0);

    if (phase === "focus") {
      setShowComplete(true);
      setCompletedSessions((v) => v + 1);
      recordSessionToSupabase(elapsed, "pomodoro");
      setFocusSessionsCompleted((prev) => {
        const updated = prev + 1;
        const nextPhase =
          updated % pomodoroSettings.sessionsBeforeLongBreak === 0 ? "longBreak" : "shortBreak";
        setPhase(nextPhase);
        setPhaseDurationMs(getPhaseDurationMs(nextPhase, pomodoroSettings));
        return updated;
      });
    } else {
      setPhase("focus");
      setPhaseDurationMs(getPhaseDurationMs("focus", pomodoroSettings));
    }
  }, [phase, pomodoroSettings, getPhaseDurationMs, phaseDurationMs, recordSessionToSupabase]);

  /* ─────────────────────────────────────────────────────────────
     Button handlers
  ───────────────────────────────────────────────────────────────*/

  /** Play / Pause toggle */
  const handlePlayPause = useCallback(() => {
    if (runState === "idle" || runState === "paused") {
      setStartTs(Date.now());
      setRunState("running");
      setShopOpen(false);
    } else {
      const elapsed = accumulatedMs + (Date.now() - startTs);
      setAccumulatedMs(elapsed);
      setStartTs(null);
      setRunState("paused");
    }
  }, [runState, accumulatedMs, startTs]);

  /** Complete button */
  const handleComplete = useCallback(() => {
    // Current total elapsed time
    const elapsed = runState === "running"
      ? accumulatedMs + (Date.now() - startTs)
      : accumulatedMs;

    if (mode === "stopwatch") {
      if (elapsed < MIN_SESSION_SECONDS * 1000) return;
      resetToIdle();
      setShowComplete(true);
      setCompletedSessions((v) => v + 1);
      recordSessionToSupabase(elapsed, "stopwatch");
    } else {
      resetToIdle();
      if (phase === "focus") {
        setShowComplete(true);
        setCompletedSessions((v) => v + 1);
        recordSessionToSupabase(elapsed, "pomodoro");
        setFocusSessionsCompleted((prev) => {
          const updated = prev + 1;
          const nextPhase =
            updated % pomodoroSettings.sessionsBeforeLongBreak === 0 ? "longBreak" : "shortBreak";
          setPhase(nextPhase);
          setPhaseDurationMs(getPhaseDurationMs(nextPhase, pomodoroSettings));
          return updated;
        });
      } else {
        setPhase("focus");
        setPhaseDurationMs(getPhaseDurationMs("focus", pomodoroSettings));
      }
    }
  }, [mode, phase, runState, accumulatedMs, startTs, pomodoroSettings, getPhaseDurationMs, resetToIdle, recordSessionToSupabase]);

  /** Reset button — restart current phase from scratch */
  const handleReset = useCallback(() => {
    resetToIdle();
  }, [resetToIdle]);

  /** Mode toggle (Edge Case 2) */
  const handleModeToggle = useCallback(() => {
    const hasProgress = runState !== "idle" || accumulatedMs > 0;
    if (hasProgress) {
      setConfirmDialog({
        message: "Switching modes will discard your current session. Continue?",
        onConfirm: () => {
          setConfirmDialog(null);
          const next = mode === "pomodoro" ? "stopwatch" : "pomodoro";
          resetToIdle(() => {
            setMode(next);
            setPhase("focus");
            setPhaseDurationMs(
              next === "pomodoro"
                ? getPhaseDurationMs("focus", pomodoroSettings)
                : DEFAULT_FOCUS_MINUTES * 60 * 1000
            );
          });
        },
      });
    } else {
      const next = mode === "pomodoro" ? "stopwatch" : "pomodoro";
      setMode(next);
      setPhase("focus");
      setPhaseDurationMs(
        next === "pomodoro"
          ? getPhaseDurationMs("focus", pomodoroSettings)
          : DEFAULT_FOCUS_MINUTES * 60 * 1000
      );
    }
  }, [mode, runState, accumulatedMs, pomodoroSettings, getPhaseDurationMs, resetToIdle]);

  /** Save settings (Edge Case 3 — only affect next phase, not current running timer) */
  const saveSettings = useCallback(() => {
    const next = {
      focusDuration: Math.max(1, Number(draftSettings.focusDuration) || 1),
      shortBreakDuration: Math.max(1, Number(draftSettings.shortBreakDuration) || 1),
      longBreakDuration: Math.max(1, Number(draftSettings.longBreakDuration) || 1),
      sessionsBeforeLongBreak: Math.max(1, Number(draftSettings.sessionsBeforeLongBreak) || 1),
    };
    setPomodoroSettings(next);
    // Only update phase duration if timer is completely idle (not running/paused mid-session)
    if (runState === "idle" && accumulatedMs === 0) {
      setPhaseDurationMs(getPhaseDurationMs(phase, next));
    }
    setSettingsOpen(false);
  }, [draftSettings, runState, accumulatedMs, phase, getPhaseDurationMs]);

  /* ─────────────────────────────────────────────────────────────
     Derived: should Complete button be enabled?
  ───────────────────────────────────────────────────────────────*/
  const elapsedForCompletion = runState === "running"
    ? accumulatedMs + (Date.now() - (startTs ?? Date.now()))
    : accumulatedMs;

  const canComplete = useMemo(() => {
    if (mode === "stopwatch") {
      return (runState === "paused" || runState === "running") && elapsedForCompletion >= MIN_SESSION_SECONDS * 1000;
    }
    // Pomodoro: can always complete if session has started (skips phase)
    return runState === "running" || (runState === "paused" && accumulatedMs > 0);
  }, [mode, runState, accumulatedMs, elapsedForCompletion]);

  const canReset = runState !== "idle" || accumulatedMs > 0;

  /* ─────────────────────────────────────────────────────────────
     Pill label
  ───────────────────────────────────────────────────────────────*/
  const pillLabel = useMemo(() => {
    if (mode === "stopwatch") return "Stopwatch • Open-ended";
    const mins = Math.ceil(phaseDurationMs / 60000);
    return `${phaseLabel} · ${mins} min`;
  }, [mode, phaseLabel, phaseDurationMs]);

  /* ─────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────*/
  return (
    <>
      {/* ── Session complete celebration overlay ── */}
      {showComplete && <SessionComplete onDone={() => setShowComplete(false)} />}

      {/* ── Mode-switch confirmation dialog ── */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* ── FOCUS CARD ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-[540px] px-4">
        <div className="rounded-2xl p-5 border glassmorphic border-white/10">
          <div className="flex flex-col items-center gap-3">

            {/* Plant ring */}
            <PlantProgress
              timerProgress={timerProgress}
              growthProgress={growthProgress}
              onPlantClick={() => { if (!isSessionLocked) setShopOpen(true); }}
              selectedTile={selectedTile}
            />

            {/* Phase pill */}
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 -mt-1 select-none">
              {pillLabel}
            </div>

            {/* Timer + controls row */}
            <div className="w-full flex items-center justify-between gap-2">

              {/* Timer display */}
              <div
                className="px-4 py-3 rounded-xl glassmorphic shrink-0"
                title={mode === "stopwatch" ? "Elapsed time" : "Remaining time"}
              >
                <div className={`text-3xl font-mono tracking-widest select-none transition-colors ${runState === "running" ? "text-timer-green" : runState === "paused" ? "text-yellow-400" : "text-white/70"
                  }`}>
                  {formattedTime}
                </div>
                {/* Tiny status indicator */}
                <div className="text-[10px] text-center mt-0.5 font-medium tracking-wide">
                  {runState === "running" && <span className="text-green-400 animate-pulse">● running</span>}
                  {runState === "paused" && <span className="text-yellow-400">⏸ paused</span>}
                  {runState === "idle" && accumulatedMs === 0 && <span className="text-white/30">ready</span>}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">

                {/* Play / Pause */}
                <button
                  id="focus-play-pause"
                  className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${runState === "running"
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20"
                    }`}
                  aria-label={runState === "running" ? "Pause" : "Play"}
                  onClick={handlePlayPause}
                >
                  {runState === "running" ? <PauseIcon /> : <PlayIcon />}
                </button>

                {/* Complete */}
                <button
                  id="focus-complete"
                  className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 flex items-center justify-center border border-blue-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={mode === "stopwatch" ? "Complete session" : "Skip / Complete phase"}
                  disabled={!canComplete}
                  onClick={handleComplete}
                  title={
                    mode === "stopwatch" && elapsedForCompletion < MIN_SESSION_SECONDS * 1000
                      ? `Need at least ${MIN_SESSION_SECONDS / 60} min to complete`
                      : mode === "pomodoro" && phase !== "focus"
                        ? "Skip break"
                        : "Complete session"
                  }
                >
                  <CheckIcon />
                </button>

                {/* Reset */}
                <button
                  id="focus-reset"
                  className="h-10 w-10 rounded-full bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center border border-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Reset timer"
                  disabled={!canReset}
                  onClick={handleReset}
                  title="Reset timer"
                >
                  <ResetIcon />
                </button>

                {/* Mode toggle: Pomodoro ↔ Stopwatch */}
                <button
                  id="focus-mode-toggle"
                  className={`h-10 px-2.5 rounded-full flex items-center gap-1.5 border transition-colors ${mode === "pomodoro"
                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/20"
                    : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/20"
                    }`}
                  title={mode === "pomodoro" ? "Switch to Stopwatch" : "Switch to Pomodoro"}
                  aria-pressed={mode === "pomodoro"}
                  onClick={handleModeToggle}
                >
                  {mode === "pomodoro" ? (
                    /* Tomato icon for Pomodoro */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="14" r="8" />
                      <path d="M12 6 C12 6 14 3 17 4" strokeLinecap="round" />
                    </svg>
                  ) : (
                    /* Stopwatch icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2 2" strokeLinecap="round" />
                      <path d="M9.5 2.5h5M12 2.5v2" strokeLinecap="round" />
                    </svg>
                  )}
                  {/* Toggle pill */}
                  <div className={`w-7 h-3.5 rounded-full relative shrink-0 ${mode === "pomodoro" ? "bg-purple-500/40" : "bg-orange-500/40"}`}>
                    <div className={`absolute w-2.5 h-2.5 rounded-full top-0.5 transition-all duration-200 ${mode === "pomodoro" ? "right-0.5 bg-purple-400" : "left-0.5 bg-orange-400"
                      }`} />
                  </div>
                </button>

                {/* Pomodoro Settings */}
                <button
                  id="focus-settings"
                  className="h-10 w-10 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
                  title="Timer Settings"
                  onClick={() => { setDraftSettings(pomodoroSettings); setSettingsOpen(true); }}
                >
                  <GearIcon />
                </button>
              </div>
            </div>

            {/* Stopwatch: show min-threshold warning when paused but too short */}
            {mode === "stopwatch" && runState === "paused" && elapsedForCompletion < MIN_SESSION_SECONDS * 1000 && (
              <p className="text-[10px] text-orange-400/70 -mt-1">
                ⚠ Need at least 1 min to complete a session
              </p>
            )}

          </div>
        </div>
      </div>

      {/* ── SETTINGS MODAL ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-label="Close settings"
            onClick={() => { setDraftSettings(pomodoroSettings); setSettingsOpen(false); }}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-200">
            {/* Neon top border glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#39ff14]/50 to-transparent" />

            {/* Background */}
            <div className="bg-[#07090e]/95 backdrop-blur-2xl p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
                    <GearIcon />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Timer Settings</h2>
                    <p className="text-[11px] text-white/35 mt-0.5">Customise your focus rhythm</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white flex items-center justify-center text-sm transition-all"
                  aria-label="Close"
                  onClick={() => { setDraftSettings(pomodoroSettings); setSettingsOpen(false); }}
                >
                  ✕
                </button>
              </div>

              {/* Active-timer warning */}
              {runState !== "idle" && (
                <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300">
                  <span className="text-base mt-px">🔒</span>
                  <p className="text-xs leading-relaxed">
                    <span className="font-semibold">Timer is active.</span>{" "}
                    Changes will apply to the <em>next</em> phase — not the currently running timer.
                  </p>
                </div>
              )}

              {/* Sliders */}
              <div className="flex flex-col gap-4">
                {[
                  { label: "Focus Duration", key: "focusDuration", icon: "🎯", color: "#39ff14", max: 120 },
                  { label: "Short Break", key: "shortBreakDuration", icon: "☕", color: "#38bdf8", max: 30 },
                  { label: "Long Break", key: "longBreakDuration", icon: "🌿", color: "#a78bfa", max: 60 },
                  { label: "Sessions Before Long Break", key: "sessionsBeforeLongBreak", icon: "🔁", color: "#fb923c", max: 10, unit: "sessions" },
                ].map(({ label, key, icon, color, max, unit }) => {
                  const val = Number(draftSettings[key]) || 1;
                  const pct = Math.round((val / max) * 100);
                  return (
                    <div key={key} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{icon}</span>
                          <span className="text-xs font-semibold text-white/75">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-base font-black tabular-nums" style={{ color }}>{val}</span>
                          <span className="text-[10px] text-white/30">{unit ?? "min"}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={max}
                        value={val}
                        disabled={runState !== "idle" && key !== "sessionsBeforeLongBreak"}
                        onChange={(e) => setDraftSettings((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
                          accentColor: color,
                        }}
                      />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[9px] text-white/20">1</span>
                        <span className="text-[9px] text-white/20">{max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer buttons */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  onClick={() => { setDraftSettings(pomodoroSettings); setSettingsOpen(false); }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="flex-[2] py-2.5 text-xs font-bold rounded-xl bg-[#39ff14]/15 border border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/25 transition-all shadow-[0_0_20px_rgba(57,255,20,0.08)]"
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── PLANT SHOP SIDEBAR ── */}
      <PlantShopSidebar
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        selectedTile={selectedTile}
        onSelectTile={(tile) => { if (!isSessionLocked) setSelectedTile(tile); }}
        selectionLocked={isSessionLocked}
        profile={profile}
        ownedPlantIds={ownedPlantIds}
        ownedLandIds={ownedLandIds}
        onBuyItem={onBuyItem}
      />
    </>
  );
};

export default FocusCard;
