import React from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ theme, setTheme }) => {
  const isDark = theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors flex items-center"
    >
      {/* Icon inherits currentColor; we'll use neon color via CSS variable */}
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun size={16} style={{ color: "var(--neon)" }} />
      ) : (
        <Moon size={16} style={{ color: "var(--neon)" }} />
      )}
    </button>
  );
};

export default ThemeToggle;