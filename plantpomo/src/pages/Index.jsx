import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import FocusCard from "@/components/FocusCard";
import VideoBackground from "@/components/VideoBackground";
import YouTubeLinkPopup from "@/components/YouTubeLinkPopup";
import { Trash2 } from "lucide-react";

const Index = () => {
  // load saved theme or default to dark
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [videoId, setVideoId] = useState(null);
  const [ytPopupOpen, setYtPopupOpen] = useState(false);

  // NEW: mute state; default true so autoplay (muted) works reliably
  // default unmuted — user can mute via button
  const [isMuted, setIsMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(80);

  // Listen for volume changes broadcast by MusicMenu
  useEffect(() => {
    const handler = (e) => {
      const v = Number(e?.detail?.volume);
      if (!Number.isNaN(v)) setVideoVolume(Math.min(100, Math.max(0, v)));
    };
    window.addEventListener("music:volume:change", handler);
    return () => window.removeEventListener("music:volume:change", handler);
  }, []);

  useEffect(() => {
    // Toggle a 'dark' class on the root element for global CSS control
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch { }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // NEW: toggle mute. This user gesture will attempt to remount iframe with sound.
  const toggleMute = () => {
    setIsMuted((m) => !m);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === "dark" ? "bg-[#05060a] text-[#e6ffe6]" : "bg-white text-[#0b1220]"
        }`}
    >
      {/* Neon CSS (scoped here) */}
      <style>{`
        :root {
          --neon: #39ff14; /* neon green */
          --neon-2: #7dfaff; /* neon cyan accent */
          --card-bg-dark: rgba(8,10,14,0.6);
          --card-border-dark: rgba(57,255,20,0.12);
        }
        .neon-text { color: var(--neon); text-shadow: 0 0 8px rgba(57,255,20,0.20), 0 0 30px rgba(57,255,20,0.06); }
        .neon-card { border-radius: 14px; }
        .dark .neon-card {
          background: linear-gradient(180deg, rgba(5,8,12,0.6), rgba(8,10,14,0.55));
          border: 1px solid var(--card-border-dark);
          box-shadow: 0 6px 30px rgba(0,0,0,0.6), 0 0 30px rgba(57,255,20,0.03) inset;
        }
        .light .neon-card {
          background: linear-gradient(180deg, #ffffff, #f7fafc);
          border: 1px solid rgba(11,18,32,0.06);
          box-shadow: 0 6px 20px rgba(8,12,20,0.04);
        }
        .neon-btn {
          border-radius: 10px;
          padding: 0.5rem 0.85rem;
          border: 1px solid transparent;
          background: linear-gradient(90deg, rgba(57,255,20,0.06), rgba(0,0,0,0.04));
          box-shadow: 0 6px 24px rgba(57,255,20,0.02);
          color: inherit;
        }
        .neon-glow {
          background: radial-gradient(circle at center, rgba(57,255,20,0.14), rgba(57,255,20,0.02));
          border-radius: 9999px;
          padding: 0.55rem;
        }
        .dark .trash-btn {
          background: linear-gradient(90deg, rgba(57,255,20,0.04), rgba(0,0,0,0.03));
          border: 1px solid rgba(57,255,20,0.08);
          color: var(--neon);
          box-shadow: 0 6px 30px rgba(57,255,20,0.03);
        }
        .dark .trash-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 60px rgba(57,255,20,0.08);
        }
          /* glassmorphic helper, timer colors, and card spacing */
        .glassmorphic {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          backdrop-filter: blur(8px) saturate(1.05);
          -webkit-backdrop-filter: blur(8px) saturate(1.05);
        }

        .bg-timer-bg {
          background: linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.32));
        }

        .bg-timer-green {
          background: linear-gradient(90deg, rgba(57,255,20,0.06), rgba(0,0,0,0.04));
        }

        .text-timer-green {
          color: #39ff14;
          text-shadow: 0 0 8px rgba(57,255,20,0.12);
        }

        /* ensure full-height roots so fixed bottom positioning is correct */
        html, body, #__next, #root {
          height: 100%;
        }

        /* make floating card responsive */
        @media (max-width: 640px) {
          .absolute.bottom-8 {
            bottom: env(safe-area-inset-bottom, 24px);
            padding-left: 12px;
            padding-right: 12px;
          }
        }

        /* softer border token used by components */
        .border-input {
          border-color: rgba(255,255,255,0.06);
        }

        /* subtle accent shadow for neon accent buttons */
        .shadow-accent {
          box-shadow: 0 6px 30px rgba(57,255,20,0.06);
        }
      `}</style>

      {/* Background video (renders only if videoId provided) */}
      <VideoBackground videoId={videoId} isMuted={isMuted} volume={videoVolume} />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* pass onGridClick, theme toggler, and mute controls */}
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onOpenYouTubePopup={() => setYtPopupOpen(true)}
        />

        <main className="flex-1 flex items-center justify-center px-4">

          <FocusCard />

        </main>

        <footer className="flex items-center justify-end px-6 py-4 gap-4">
          <button
            className="p-3 rounded-lg transition-transform trash-btn"
            title="Delete"
            onClick={() => {
              /* hook deletion here */
              console.log("trash");
            }}
          >
            <Trash2 size={18} />
          </button>
        </footer>
      </div>

      {/* YouTube popup: onSubmit receives videoId or empty string to remove */}
      <YouTubeLinkPopup
        open={ytPopupOpen}
        onClose={() => setYtPopupOpen(false)}
        onSubmit={(id) => {
          console.log("Index: onSubmit received id:", id);
          setVideoId(id || null);
          // keep muted on first load so autoplay works, user can unmute after
          setIsMuted(false);
          setYtPopupOpen(false);
        }}
      />
    </div>
  );
};

export default Index;