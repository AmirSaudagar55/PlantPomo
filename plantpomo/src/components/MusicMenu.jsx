import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Plus, Volume1, Volume2, VolumeX,
  Upload, Play, Pause, X, Headphones,
} from "lucide-react";

/* ── Volume icon ──────────────────────────────────────────────────────────── */
const VolumeIcon = ({ v }) => {
  if (v === 0) return <VolumeX size={14} className="text-white/40 shrink-0" />;
  if (v < 50) return <Volume1 size={14} className="text-emerald-400/80 shrink-0" />;
  return <Volume2 size={14} className="text-emerald-400 shrink-0" />;
};

/* ── CSS visualizer bars (purely decorative) ──────────────────────────────── */
const VisualizerBars = ({ playing }) => (
  <div className={`flex items-end gap-[2px] h-4 ${playing ? "" : "opacity-30"}`}>
    {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9].map((h, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full bg-emerald-400"
        style={{
          height: `${h * 100}%`,
          animation: playing ? `vizBar 0.${6 + i}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.07}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes vizBar {
        from { transform: scaleY(0.3); }
        to   { transform: scaleY(1); }
      }
    `}</style>
  </div>
);

/* ── Range slider (shared style) ─────────────────────────────────────────── */
const RangeSlider = ({ value, onChange, color = "#34d399" }) => (
  <>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="music-vol-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(255,255,255,0.08) ${value}%, rgba(255,255,255,0.08) 100%)`,
      }}
    />
    <style>{`
      .music-vol-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color}; cursor: pointer;
        box-shadow: 0 0 6px ${color}99;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .music-vol-slider::-webkit-slider-thumb:hover {
        transform: scale(1.3); box-shadow: 0 0 12px ${color};
      }
      .music-vol-slider::-moz-range-thumb {
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color}; border: none; cursor: pointer;
      }
      .music-vol-slider:focus { outline: none; }
    `}</style>
  </>
);

/* ── Main component ───────────────────────────────────────────────────────── */
const MusicMenu = ({ onOpenYouTubePopup = () => { } }) => {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [localFile, setLocalFile] = useState(null);  // { name, url, isVideo }
  const [isPlaying, setIsPlaying] = useState(false);
  const [localVol, setLocalVol] = useState(80);

  const menuRef = useRef(null);
  const fileRef = useRef(null);     // hidden <input type="file">
  const audioRef = useRef(null);     // <audio> or <video> element
  const blobRef = useRef(null);     // current object URL to revoke

  /* ── Close on outside click ────────────────────────────────────────────── */
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* ── Revoke blob URL on unmount ─────────────────────────────────────────── */
  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  /* ── Sync local media element volume ────────────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = localVol / 100;
  }, [localVol]);

  /* ── Timer quick-set ───────────────────────────────────────────────────── */
  const setTimer = (mins) => {
    window.dispatchEvent(new CustomEvent("music:timer:set", { detail: { mins } }));
    setOpen(false);
  };
  const askCustomTime = () => {
    const val = prompt("Enter custom time in minutes:");
    const mins = Number(val);
    if (!Number.isNaN(mins) && mins > 0) setTimer(mins);
  };

  /* ── Video background volume ────────────────────────────────────────────── */
  const onVolumeChange = (v) => {
    setVolume(v);
    window.dispatchEvent(new CustomEvent("music:volume:change", { detail: { volume: v } }));
  };

  /* ── Local file handling ────────────────────────────────────────────────── */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old blob URL to free memory
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);

    const url = URL.createObjectURL(file);
    blobRef.current = url;
    const isVideo = file.type.startsWith("video/");

    setLocalFile({ name: file.name, url, isVideo });
    setIsPlaying(false);

    // Pause and reset the element before swapping src
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.volume = localVol / 100;
    }
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }, [localVol]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => { });
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  const clearLocalFile = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    setLocalFile(null);
    setIsPlaying(false);
  }, []);

  /* ── YouTube ────────────────────────────────────────────────────────────── */
  const handleAddYoutube = () => {
    setOpen(false);
    setTimeout(() => onOpenYouTubePopup(), 80);
  };

  /* ── Truncate file name ─────────────────────────────────────────────────── */
  const shortName = localFile
    ? localFile.name.length > 32 ? localFile.name.slice(0, 29) + "…" : localFile.name
    : "";

  return (
    <div ref={menuRef} className="relative">
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden audio/video element (persists outside the dropdown) */}
      <audio ref={audioRef} loop style={{ display: "none" }} onEnded={() => setIsPlaying(false)} />

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Music & volume"
        className={`p-2 rounded-lg transition-colors ${open ? "bg-border" : "bg-secondary hover:bg-border"}`}
      >
        <Music size={16} className={open ? "text-emerald-400" : "text-muted-foreground"} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          className="absolute right-0 mt-2 w-[300px] bg-[#07090e]/98 border border-white/10 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-4 z-50"
        >
          {/* Neon top line */}
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent rounded-full" />

          {/* ── VIDEO BACKGROUND VOLUME ──────────────────────────────────── */}
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
            Background Video Volume
          </p>
          <div className="mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
                className="hover:scale-110 transition-transform"
                title={volume === 0 ? "Unmute" : "Mute"}
              >
                <VolumeIcon v={volume} />
              </button>
              <span className={`text-xs font-bold tabular-nums ${volume === 0 ? "text-white/30" : "text-emerald-400"}`}>
                {volume}%
              </span>
            </div>
            <RangeSlider value={volume} onChange={onVolumeChange} />
          </div>

          <hr className="border-white/[0.06] mb-3" />

          {/* ── LOCAL MUSIC PLAYER ──────────────────────────────────────── */}
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
            Personal Music
          </p>

          {!localFile ? (
            /* Upload zone */
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full mb-3 py-5 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-400/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all group flex flex-col items-center gap-2"
            >
              <Upload size={18} className="text-white/30 group-hover:text-emerald-400 transition-colors" />
              <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors font-medium">
                Click to open audio / video file
              </span>
              <span className="text-[9px] text-white/20">mp3 · wav · ogg · mp4 · webm · m4a</span>
            </button>
          ) : (
            /* Mini-player */
            <div className="mb-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-400/15">
              {/* File name + visualizer */}
              <div className="flex items-center gap-2 mb-3">
                <Headphones size={14} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] text-white/75 font-medium flex-1 truncate">{shortName}</span>
                <VisualizerBars playing={isPlaying} />
              </div>

              {/* Controls row */}
              <div className="flex items-center gap-2 mb-3">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/25 flex items-center justify-center transition-all"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Volume */}
                <div className="flex-1">
                  <RangeSlider value={localVol} onChange={setLocalVol} color="#34d399" />
                </div>

                {/* Local vol % */}
                <span className="text-[10px] text-white/35 tabular-nums w-7 text-right">{localVol}%</span>

                {/* Clear */}
                <button
                  onClick={clearLocalFile}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-white/30 flex items-center justify-center transition-all"
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Change file */}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-1"
              >
                <Upload size={11} /> Change file
              </button>
            </div>
          )}

          <hr className="border-white/[0.06] mb-3" />

          {/* ── TIMER ───────────────────────────────────────────────────── */}
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
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

          {/* ── YouTube ─────────────────────────────────────────────────── */}
          <button
            onClick={handleAddYoutube}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-xl bg-red-500/8 hover:bg-red-500/15 border border-red-500/15 hover:border-red-500/30 transition-all text-xs font-medium text-red-400 hover:text-red-300"
          >
            <Plus size={13} />
            Add YouTube background
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicMenu;