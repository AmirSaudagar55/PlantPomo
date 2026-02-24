import React, { useState, useRef, useEffect } from "react";
import { Music, Play, Plus } from "lucide-react";

const MusicMenu = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Lofi");
  const [volume, setVolume] = useState(50);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const setTimer = (mins) => {
    // emits event so your timer can pick it up
    window.dispatchEvent(new CustomEvent("music:timer:set", { detail: { mins } }));
    setOpen(false);
  };

  const askCustomTime = () => {
    const val = prompt("Enter custom time in minutes:");
    const mins = Number(val);
    if (!Number.isNaN(mins) && mins > 0) setTimer(mins);
  };

  const onAddYoutube = async () => {
    const url = prompt("Paste YouTube video URL or ID to add:");
    if (!url) return;
    // normalize: try to extract id quickly
    let id = url.trim();
    const match = id.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (match) id = match[1];
    window.dispatchEvent(new CustomEvent("music:youtube:add", { detail: { id, raw: url } }));
    setOpen(false);
  };

  const setPersonalMusic = () => {
    const url = prompt("Paste the audio file URL or streaming link:");
    if (!url) return;
    window.dispatchEvent(new CustomEvent("music:personal:set", { detail: { url } }));
    setOpen(false);
  };

  const onVolumeChange = (v) => {
    setVolume(v);
    window.dispatchEvent(new CustomEvent("music:volume:change", { detail: { volume: v } }));
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Open music menu"
        className={`p-2 rounded-lg bg-secondary hover:bg-border transition-colors`}
      >
        <Music size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg p-3 z-50"
          style={{ minWidth: 280 }}
        >
          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setTab("Lofi")}
              className={`flex-1 py-2 rounded-md ${tab === "Lofi" ? "bg-accent text-background" : "bg-secondary"}`}
            >
              Lofi
            </button>
            <button
              onClick={() => setTab("Ghibli")}
              className={`flex-1 py-2 rounded-md ${tab === "Ghibli" ? "bg-accent text-background" : "bg-secondary"}`}
            >
              Ghibli
            </button>
          </div>

          {/* Time presets */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => setTimer(5)} className="flex-1 py-2 rounded-md bg-secondary">5m</button>
            <button onClick={() => setTimer(15)} className="flex-1 py-2 rounded-md bg-secondary">15m</button>
            <button onClick={() => setTimer(30)} className="flex-1 py-2 rounded-md bg-secondary">30m</button>
          </div>

          <div className="mb-3">
            <button onClick={askCustomTime} className="w-full py-2 rounded-md bg-secondary">Custom time</button>
          </div>

          <hr className="my-2 border-border" />

          {/* Volume */}
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 28, textAlign: "center" }}>🔈</div>
            <input
              aria-label="Music volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="flex-1"
            />
            <div style={{ width: 36, textAlign: "right" }}>{volume}%</div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={setPersonalMusic} className="py-2 rounded-md bg-secondary text-left">
              <span className="flex items-center gap-2"><Plus size={14} /> Set personal music</span>
            </button>
            <button onClick={onAddYoutube} className="py-2 rounded-md bg-secondary text-left">
              <span className="flex items-center gap-2"><Plus size={14} /> Add YouTube content</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicMenu;