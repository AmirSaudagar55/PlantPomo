import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import FocusCard from "@/components/FocusCard";
import VideoBackground from "@/components/VideoBackground";
import YouTubeLinkPopup from "@/components/YouTubeLinkPopup";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { Trash2, LayoutGrid } from "lucide-react";
import { useProfile } from "@/lib/useProfile";
import { useInventory } from "@/lib/useInventory";

const Index = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const { ownedPlantIds, ownedLandIds, buyItem } = useInventory(profile, refetchProfile);

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
  const [heatMapOpen, setHeatMapOpen] = useState(false);

  // default unmuted — user can mute via button
  const [isMuted, setIsMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(80);
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  // Listen for view toggle events
  useEffect(() => {
    const handler = (e) => {
      if (typeof e?.detail?.hidden === "boolean") {
        setIsVideoHidden(e.detail.hidden);
      }
    };
    window.addEventListener("video:visibilitychange", handler);
    return () => window.removeEventListener("video:visibilitychange", handler);
  }, []);

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
  const toggleMute = () => setIsMuted((m) => !m);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === "dark" ? "bg-[#05060a] text-[#e6ffe6]" : "bg-white text-[#0b1220]"}`}
    >
      {/* Neon CSS (scoped here) */}
      <style>{`
        :root {
          --neon: #39ff14;
          --neon-2: #7dfaff;
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
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
          color: #f87171;
          box-shadow: 0 6px 30px rgba(239,68,68,0.04);
        }
        .dark .trash-btn:not(:disabled):hover {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #ef4444;
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(239,68,68,0.08);
        }
        .dark .heatmap-btn {
          background: rgba(57,255,20,0.06);
          border: 1px solid rgba(57,255,20,0.12);
          color: var(--neon);
          box-shadow: 0 6px 30px rgba(57,255,20,0.03);
        }
        .dark .heatmap-btn:hover {
          background: rgba(57,255,20,0.12);
          border: 1px solid rgba(57,255,20,0.25);
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(57,255,20,0.08);
        }
        .heatmap-active {
          background: rgba(57,255,20,0.2) !important;
          border: 1px solid rgba(57,255,20,0.4) !important;
          color: #ffffff !important;
          box-shadow: 0 0 20px rgba(57,255,20,0.2) !important;
        }
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
        html, body, #__next, #root {
          height: 100%;
        }
        @media (max-width: 640px) {
          .absolute.bottom-8 {
            bottom: env(safe-area-inset-bottom, 24px);
            padding-left: 12px;
            padding-right: 12px;
          }
        }
        .border-input {
          border-color: rgba(255,255,255,0.06);
        }
        .shadow-accent {
          box-shadow: 0 6px 30px rgba(57,255,20,0.06);
        }
      `}</style>

      {/* Background video */}
      <VideoBackground videoId={videoId} isMuted={isMuted} volume={videoVolume} isHidden={isVideoHidden} />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onOpenYouTubePopup={() => setYtPopupOpen(true)}
          profile={profile}
        />

        <main className="flex-1 flex items-center justify-center px-4">
          <FocusCard
            profile={profile}
            refetchProfile={refetchProfile}
            ownedPlantIds={ownedPlantIds}
            ownedLandIds={ownedLandIds}
            onBuyItem={buyItem}
          />
        </main>

        <footer className="flex items-center justify-between px-6 py-4 gap-4">
          {/* Activity Heatmap toggle — bottom left */}
          <button
            id="heatmap-toggle-btn"
            title="Focus Activity"
            onClick={() => setHeatMapOpen((v) => !v)}
            className={`p-3 rounded-xl transition-all heatmap-btn ${heatMapOpen ? "heatmap-active" : ""}`}
          >
            <LayoutGrid size={18} />
          </button>

          {/* Trash — bottom right */}
          <button
            className="p-3 rounded-lg transition-transform trash-btn disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:border-white/5"
            title={videoId ? "Remove background video" : "No video loaded"}
            disabled={!videoId}
            onClick={() => setVideoId(null)}
          >
            <Trash2 size={18} />
          </button>
        </footer>

        {/* Activity Heatmap popup */}
        <ActivityHeatmap
          open={heatMapOpen}
          onClose={() => setHeatMapOpen(false)}
          userId={profile?.id ?? null}
        />
      </div>

      {/* YouTube popup */}
      <YouTubeLinkPopup
        open={ytPopupOpen}
        onClose={() => setYtPopupOpen(false)}
        onSubmit={(id) => {
          setVideoId(id || null);
          setIsMuted(false);
          setYtPopupOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
