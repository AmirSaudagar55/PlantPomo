import React from "react";
import { Plus, BarChart3, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import ShowHideVideoToggle from "./ShowHideVideoToggle";
import MusicMenu from "./MusicMenu";

/**
 * Navbar
 * - onGridClick: optional callback (opens YouTube popup)
 * - theme: "dark" | "light"
 * - toggleTheme: () => void
 * - isMuted: boolean
 * - toggleMute: () => void
 */
const Navbar = ({
  onGridClick,
  theme = "dark",
  toggleTheme = () => {},
  isMuted = true,
  toggleMute = () => {},
}) => {
  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        {/* <button
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
          aria-label="Create project"
        >
          <Plus size={16} />
          <span>Create Your First Project</span>
        </button> */}
      </div>

      <div className="flex items-center gap-2 text-sm text-foreground">
        <span>🔥</span>
        <span>
          Days Locked In: <strong>0</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Chart/analytics button */}
        <button
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
          aria-label="Analytics"
          title="Analytics"
        >
          <BarChart3 size={16} className="text-muted-foreground" />
        </button>

        {/* Grid button -> open YT popup when provided */}
        <button
          onClick={() => {
            if (typeof onGridClick === "function") onGridClick();
          }}
          title="Set background video"
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="text-muted-foreground"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <ShowHideVideoToggle />
        <MusicMenu />

        {/* Mute/unmute toggle (user gesture) */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute background video" : "Mute background video"}
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX size={16} className="text-muted-foreground" />
          ) : (
            <Volume2 size={16} className="text-muted-foreground" />
          )}
        </button>

        {/* Theme toggle (shows current state, toggles on click) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
          className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
        >
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* small avatar/brand dot */}
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent to-primary" />
      </div>
    </nav>
  );
};

export default Navbar;