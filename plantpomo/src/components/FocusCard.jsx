import React, { useState } from "react";
import PlantProgress from "./PlantProgress";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import TaskTabs from "./TaskTabs";
import PlantShopSidebar from "./PlantShopSidebar";

/**
 * Floating Focus Card — bottom center, glassmorphic, neon highlights
 */
const FocusCard = () => {
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <>
      {/* Floating container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-500 scale-100 w-full max-w-lg px-4">
        <div className="rounded-xl p-6 border glassmorphic border-white/10 transition-all duration-500">
          <div className="flex flex-col items-center">
            
            {/* 🌱 Plant Progress (NEW) */}
            <PlantProgress
              timerProgress={75}
              growthProgress={60}
              onPlantClick={() => setShopOpen(true)}
            />

            {/* Subtitle */}
            <div className="mb-4 text-center">
              <p className="text-white/70 text-sm max-w-xs">
                Ready to lock in on your idea?
              </p>
            </div>

            {/* Focus badge */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 border border-green-500/30"
              >
                Focus (30 min)
              </button>
            </div>

            {/* ⏱️ Timer + Controls (your existing UI kept) */}
            <div className="flex items-center gap-10 mb-4">
              <div className="flex flex-col items-center rounded-lg p-4 glassmorphic text-white text-4xl font-mono">
                <div className="text-4xl font-mono text-timer-green">
                  00:30:00
                </div>
              </div>

              <div className="flex gap-3">
                {/* Play */}
                <button
                  className="gap-2 whitespace-nowrap text-sm font-medium border border-input px-4 py-2 rounded-full h-12 w-12 bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 flex items-center justify-center"
                  aria-label="Start"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
                </button>

                {/* Complete */}
                <button
                  className="gap-2 whitespace-nowrap text-sm font-medium border border-input px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 h-12 w-12 flex items-center justify-center"
                  aria-label="Complete"
                  disabled
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                </button>

                {/* Pomodoro toggle */}
                <button
                  className="gap-2 whitespace-nowrap text-sm font-medium border py-2 h-12 px-3 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 border-purple-500/30"
                  title="Pomodoro Mode"
                  aria-pressed="false"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="14" r="8"></circle>
                  </svg>

                  <div className="w-10 h-5 rounded-full relative bg-purple-500/50 transition-colors duration-200">
                    <div className="absolute w-4 h-4 rounded-full transition-all duration-200 bg-purple-400 top-0.5 right-0.5 shadow-md" />
                  </div>
                </button>

                {/* Settings */}
                <button
                  className="gap-2 whitespace-nowrap text-sm font-medium border border-input px-4 py-2 h-12 w-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center"
                  title="Pomodoro Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex items-center w-full">
              <div className="w-full">
                <div dir="ltr" data-orientation="horizontal" className="w-full">
                  <div
                    role="tablist"
                    aria-orientation="horizontal"
                    className="inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground bg-black/40 border border-white/10 w-full"
                    tabIndex={0}
                  >
                    <TaskTabs />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🛒 Shop Sidebar (NEW) */}
      <PlantShopSidebar
        open={shopOpen}
        onClose={() => setShopOpen(false)}
      />
    </>
  );
};

export default FocusCard;