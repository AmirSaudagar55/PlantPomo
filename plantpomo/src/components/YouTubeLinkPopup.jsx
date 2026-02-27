import React, { useState } from "react";
import { X, Play, Trash2, Youtube } from "lucide-react";

function extractVideoId(input) {
  if (!input) return null;
  const s = input.trim();

  // raw 11-char id
  const rawId = s.match(/^([a-zA-Z0-9_-]{11})$/);
  if (rawId) return rawId[1];

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,      // ?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // youtu.be/ID
    /embed\/([a-zA-Z0-9_-]{11})/,     // /embed/ID
    /\/v\/([a-zA-Z0-9_-]{11})/,       // /v/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/   // /shorts/ID
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1]) return m[1];
  }

  try {
    const url = new URL(s);
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  } catch (e) {
    // not a URL
  }

  return null;
}

const YouTubeLinkPopup = ({ open, onClose, onSubmit }) => {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    const id = extractVideoId(link);
    if (!id) {
      setError("Please enter a valid YouTube link or 11-character video ID.");
      return;
    }
    onSubmit(id);
    setLink("");
    setError("");
    onClose();
  };

  const handleRemove = () => {
    onSubmit("");
    setLink("");
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[24px] overflow-hidden border border-white/10 bg-[#0d1117]/85 backdrop-blur-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6),0_0_40px_rgba(57,255,20,0.03)] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Border Glow Effect */}
        <div className="absolute inset-0 pointer-events-none rounded-[24px] ring-1 ring-white/10" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            <Youtube size={20} />
          </div>
          <div>
            <h3 className="text-white text-lg font-bold tracking-tight">Set Ambiance</h3>
            <p className="text-white/40 text-[11px] font-medium leading-none mt-1">Paste a background video</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={link}
              autoFocus
              onChange={(e) => { setLink(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Paste YouTube Link or ID..."
              className={`w-full h-12 px-4 rounded-xl bg-black/40 border transition-all outline-none text-sm text-white placeholder:text-white/20
                ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#39ff14]/50 group-hover:border-white/20"}
              `}
            />
          </div>

          {error && (
            <div className="px-1 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="group relative flex items-center justify-center gap-2 w-full h-12 rounded-xl transition-all active:scale-[0.98] overflow-hidden"
            >
              {/* Button Bg */}
              <div className="absolute inset-0 bg-[#39ff14] transition-all group-hover:brightness-110" />
              {/* Button Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4),transparent_70%)] transition-opacity" />

              <Play size={16} className="relative z-10 text-black fill-black" />
              <span className="relative z-10 text-black font-bold text-sm">Play Video</span>
            </button>

            <button
              onClick={handleRemove}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/40 text-sm font-semibold transition-all transition-all active:scale-[0.98]"
            >
              <Trash2 size={15} />
              Remove Background
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-white/20 font-medium">
          Note: Some videos might be restricted by owners
        </p>
      </div>
    </div>
  );
};

export default YouTubeLinkPopup;