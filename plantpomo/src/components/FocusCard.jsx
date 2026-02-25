import React, { useCallback, useEffect, useMemo, useState } from "react";
import PlantProgress from "./PlantProgress";
import PlantShopSidebar, { plants, lands } from "./PlantShopSidebar";
import SessionComplete from "./SessionComplete";

const DEFAULT_FOCUS_MINUTES = 30;
const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const FocusCard = () => {
  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(0);
  const [phase, setPhase] = useState("focus");
  const [pomodoroSettings, setPomodoroSettings] = useState(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState(DEFAULT_SETTINGS);
  const [selectedPlant, setSelectedPlant] = useState(() => plants.find((p) => p.owned) ?? plants[0]);
  const [selectedLand, setSelectedLand] = useState(() => lands.find((l) => l.owned) ?? lands[0]);
  const [showComplete, setShowComplete] = useState(false);

  // Allow Navbar "Store" button to open shop via CustomEvent
  useEffect(() => {
    const handler = () => setShopOpen(true);
    window.addEventListener("shop:open", handler);
    return () => window.removeEventListener("shop:open", handler);
  }, []);

  const applyDuration = useCallback((minutes) => {
    const seconds = Math.max(1, Math.floor(minutes * 60));
    setDurationSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
  }, []);

  const getPhaseMinutes = (nextPhase, settings) => {
    if (nextPhase === "shortBreak") return settings.shortBreakDuration;
    if (nextPhase === "longBreak") return settings.longBreakDuration;
    return settings.focusDuration;
  };

  const advancePomodoroPhase = useCallback(() => {
    if (phase === "focus") {
      setShowComplete(true);        // 🎉 fire celebration on focus completion
      setCompletedSessions((v) => v + 1);
      setFocusSessionsCompleted((v) => {
        const updated = v + 1;
        const nextPhase =
          updated % pomodoroSettings.sessionsBeforeLongBreak === 0
            ? "longBreak"
            : "shortBreak";
        setPhase(nextPhase);
        applyDuration(getPhaseMinutes(nextPhase, pomodoroSettings));
        return updated;
      });
      return;
    }
    setPhase("focus");
    applyDuration(pomodoroSettings.focusDuration);
  }, [phase, pomodoroSettings, applyDuration]);

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          if (isPomodoro) advancePomodoroPhase();
          else setCompletedSessions((v) => v + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRunning, isPomodoro, advancePomodoroPhase]);

  useEffect(() => {
    const onTimerSet = (event) => {
      const mins = Number(event?.detail?.mins);
      if (!Number.isNaN(mins) && mins > 0) {
        setIsPomodoro(false);
        setPhase("focus");
        applyDuration(mins);
      }
    };
    window.addEventListener("music:timer:set", onTimerSet);
    return () => window.removeEventListener("music:timer:set", onTimerSet);
  }, [applyDuration]);

  const timerProgress = useMemo(() => {
    if (durationSeconds <= 0) return 0;
    return ((durationSeconds - remainingSeconds) / durationSeconds) * 100;
  }, [durationSeconds, remainingSeconds]);

  const growthProgress = useMemo(
    () => Math.min(100, completedSessions * 20),
    [completedSessions]
  );

  const formattedTime = useMemo(() => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return [hours, minutes, seconds]
      .map((v) => String(v).padStart(2, "0"))
      .join(":");
  }, [remainingSeconds]);

  const phaseLabel = useMemo(() => {
    if (!isPomodoro) return "Focus";
    if (phase === "shortBreak") return "Short Break";
    if (phase === "longBreak") return "Long Break";
    return "Focus";
  }, [isPomodoro, phase]);

  const saveSettings = () => {
    const next = {
      focusDuration: Math.max(1, Number(draftSettings.focusDuration) || 1),
      shortBreakDuration: Math.max(1, Number(draftSettings.shortBreakDuration) || 1),
      longBreakDuration: Math.max(1, Number(draftSettings.longBreakDuration) || 1),
      sessionsBeforeLongBreak: Math.max(1, Number(draftSettings.sessionsBeforeLongBreak) || 1),
    };
    setPomodoroSettings(next);
    if (isPomodoro) applyDuration(getPhaseMinutes(phase, next));
    else if (phase === "focus") applyDuration(next.focusDuration);
    setSettingsOpen(false);
  };

  /* ─── SVGs ─── */
  const GearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );

  return (
    <>
      {/* ── FOCUS CARD ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-[480px] px-4">
        <div className="rounded-2xl p-5 border glassmorphic border-white/10">
          <div className="flex flex-col items-center gap-3">

            {/* Plant ring */}
            <PlantProgress
              timerProgress={timerProgress}
              growthProgress={growthProgress}
              onPlantClick={() => setShopOpen(true)}
              selectedPlant={selectedPlant}
              selectedLand={selectedLand}
            />

            {/* Phase pill */}
            <button
              type="button"
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 -mt-1"
            >
              {phaseLabel} · {Math.ceil(durationSeconds / 60)} min
            </button>

            {/* Timer display + controls — all inside card, no overflow */}
            <div className="w-full flex items-center justify-between gap-2">

              {/* Timer */}
              <div className="px-4 py-3 rounded-xl glassmorphic shrink-0">
                <div className="text-3xl font-mono text-timer-green tracking-widest select-none">
                  {formattedTime}
                </div>
              </div>

              {/* Buttons — shrink-0 each so they never squish the timer */}
              <div className="flex items-center gap-1.5">

                {/* Play / Pause */}
                <button
                  className="h-10 w-10 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 flex items-center justify-center border border-green-500/20 transition-colors"
                  aria-label={isRunning ? "Pause" : "Start"}
                  onClick={() => {
                    if (remainingSeconds === 0) setRemainingSeconds(durationSeconds);
                    setIsRunning((v) => !v);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isRunning
                      ? <><line x1="6" y1="4" x2="6" y2="20" /><line x1="18" y1="4" x2="18" y2="20" /></>
                      : <polygon points="6 3 20 12 6 21 6 3" />
                    }
                  </svg>
                </button>

                {/* Complete */}
                <button
                  className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 flex items-center justify-center border border-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Complete session"
                  disabled={remainingSeconds === 0}
                  onClick={() => {
                    if (remainingSeconds === 0) return;
                    if (isPomodoro) {
                      setIsRunning(false);
                      advancePomodoroPhase(); // handles showComplete for focus phase
                    } else {
                      // plain timer manual complete — always a focus session
                      setShowComplete(true);
                      setCompletedSessions((v) => v + 1);
                      setRemainingSeconds(0);
                      setIsRunning(false);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </button>

                {/* Pomodoro mode toggle */}
                <button
                  className="h-10 px-2 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center gap-1 border border-purple-500/20 transition-colors"
                  title="Pomodoro Mode"
                  aria-pressed={isPomodoro}
                  onClick={() => {
                    setIsPomodoro((v) => {
                      const next = !v;
                      setPhase("focus");
                      applyDuration(next ? pomodoroSettings.focusDuration : DEFAULT_FOCUS_MINUTES);
                      return next;
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="14" r="8" />
                  </svg>
                  {/* mini toggle pill */}
                  <div className="w-7 h-3.5 rounded-full relative bg-purple-500/40 shrink-0">
                    <div className={`absolute w-2.5 h-2.5 rounded-full bg-purple-400 top-0.5 transition-all duration-200 ${isPomodoro ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </button>

                {/* Pomodoro settings */}
                <button
                  className="h-10 w-10 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
                  title="Pomodoro Settings"
                  onClick={() => { setDraftSettings(pomodoroSettings); setSettingsOpen(true); }}
                >
                  <GearIcon />
                </button>

              </div>
            </div>


          </div>
        </div>
      </div>

      {/* ── SETTINGS MODAL ── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-[#0d1117]/95 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-semibold text-white">⏱ Pomodoro Settings</div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 flex items-center justify-center text-sm"
                aria-label="Close"
                onClick={() => setSettingsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Focus Duration (min)", key: "focusDuration" },
                { label: "Short Break (min)", key: "shortBreakDuration" },
                { label: "Long Break (min)", key: "longBreakDuration" },
                { label: "Sessions Before Long Break", key: "sessionsBeforeLongBreak" },
              ].map(({ label, key }) => (
                <label key={key} className="text-xs text-white/80">
                  {label}
                  <input
                    type="number"
                    min="1"
                    value={draftSettings[key]}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-2 py-2 text-sm text-white outline-none focus:border-green-500/50"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border border-white/20 text-white/80 hover:bg-white/10"
                onClick={() => setSettingsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30"
                onClick={saveSettings}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLANT SHOP SIDEBAR ── */}
      <PlantShopSidebar
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        selectedPlant={selectedPlant}
        onSelectPlant={setSelectedPlant}
        selectedLand={selectedLand}
        onSelectLand={setSelectedLand}
      />
    </>
  );
};

export default FocusCard;
