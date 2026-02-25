import React, { useState, useRef, useEffect } from "react";
import { Music, Plus, Volume1, Volume2, VolumeX } from "lucide-react";

/** Volume icon that changes based on level */
const VolumeIcon = ({ v }) => {
  if (v === 0) return <VolumeX size={14} className="text-white/40 shrink-0" />;
  if (v < 50) return <Volume1 size={14} className="text-emerald-400/80 shrink-0" />;
  return <Volume2 size={14} className="text-emerald-400 shrink-0" />;
};

const MusicMenu = ({ onOpenYouTubePopup = () => { } }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("Lofi");
  const [volume, setVolume] = useState(80); // default matches Index.jsx default
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const setTimer = (mins) => {
    window.dispatchEvent(new CustomEvent("music:timer:set", { detail: { mins } }));
    setOpen(false);
  };

  const askCustomTime = () => {
    const val = prompt("Enter custom time in minutes:");
    const mins = Number(val);
    if (!Number.isNaN(mins) && mins > 0) setTimer(mins);
  };

  const handleAddYoutube = () => {
    setOpen(false);
    setTimeout(() => onOpenYouTubePopup(), 80);
  };

  const setPersonalMusic = () => {
    const url = prompt("Paste the audio file URL or streaming link:");
    if (!url) return;
    window.dispatchEvent(new CustomEvent("music:personal:set", { detail: { url } }));
    setOpen(false);
  };

  const onVolumeChange = (v) => {
    setVolume(v);
    // Broadcast to Index.jsx → VideoBackground
    window.dispatchEvent(new CustomEvent("music:volume:change", { detail: { volume: v } }));
  };

  /** Track fill % for the custom range gradient */
  const fillPct = volume;

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Music & volume"
        className={`p-2 rounded-lg transition-colors ${open ? "bg-border" : "bg-secondary hover:bg-border"
          }`}
      >
        <Music size={16} className={open ? "text-emerald-400" : "text-muted-foreground"} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          className="absolute right-0 mt-2 w-[280px] bg-[hsl(220,20%,7%)]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 z-50"
        >
          {/* Header */}
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">
            Background Music
          </p>

          {/* Genre tabs */}
          <div className="flex gap-1.5 mb-3 p-1 bg-white/5 rounded-xl">
            {["Lofi", "Ghibli"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${tab === t
                    ? "bg-emerald-500/25 text-emerald-300 shadow-inner"
                    : "text-white/40 hover:text-white/70"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── VOLUME SECTION ── */}
          <div className="mb-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                Volume
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${volume === 0 ? "text-white/30" : "text-emerald-400"
                  }`}
              >
                {volume}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dynamic volume icon — click to mute/unmute */}
              <button
                onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
                className="shrink-0 hover:scale-110 transition-transform"
                title={volume === 0 ? "Unmute" : "Mute"}
              >
                <VolumeIcon v={volume} />
              </button>

              {/* Custom styled range input */}
              <div className="relative flex-1 h-5 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  aria-label="Video volume"
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="volume-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #34d399 0%, #34d399 ${fillPct}%, rgba(255,255,255,0.08) ${fillPct}%, rgba(255,255,255,0.08) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Volume level text */}
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-white/20">Silent</span>
              <span className="text-[10px] text-white/20">Max</span>
            </div>
          </div>

          <hr className="border-white/8 mb-3" />

          {/* Timer section */}
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            Set Timer
          </p>
          <div className="flex gap-1.5 mb-2">
            {[5, 15, 30].map((m) => (
              <button
                key={m}
                onClick={() => setTimer(m)}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-colors"
              >
                {m}m
              </button>
            ))}
          </div>
          <button
            onClick={askCustomTime}
            className="w-full py-2 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 transition-colors mb-3"
          >
            Custom time…
          </button>

          <hr className="border-white/8 mb-3" />

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={setPersonalMusic}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs text-white/60 hover:text-white"
            >
              <Plus size={13} />
              Set personal music
            </button>
            <button
              onClick={handleAddYoutube}
              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs text-white/60 hover:text-white"
            >
              <Plus size={13} />
              Add YouTube background
            </button>
          </div>
        </div>
      )}

      {/* Scoped styles for the range thumb */}
      <style>{`
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.9);
        }
        .volume-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
          cursor: pointer;
          border: none;
        }
        .volume-slider:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default MusicMenu;