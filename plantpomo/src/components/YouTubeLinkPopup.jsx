// YouTubeLinkPopup.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

function extractVideoId(input) {
  if (!input) return null;
  const s = input.trim();

  // raw 11-char id
  const rawId = s.match(/^([a-zA-Z0-9_-]{11})$/);
  if (rawId) return rawId[1];

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,     // ?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,// youtu.be/ID
    /embed\/([a-zA-Z0-9_-]{11})/,    // /embed/ID
    /\/v\/([a-zA-Z0-9_-]{11})/,      // /v/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/  // /shorts/ID
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1]) return m[1];
  }

  // fallback: try parsing search params from a URL
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
      setError("Invalid YouTube link or video id — paste the full URL or the 11-character id.");
      return;
    }

    // debug helper (remove in prod)
    console.log("YouTubeLinkPopup: resolved id =", id);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="text-foreground text-lg font-semibold mb-4">Set Background Video</h3>

        <input
          type="text"
          value={link}
          onChange={(e) => { setLink(e.target.value); setError(""); }}
          placeholder="Paste YouTube link or video id (11 chars)"
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent"
        />

        {error && <p className="text-destructive text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Play Video
          </button>

          <button
            onClick={handleRemove}
            className="py-3 px-4 rounded-xl bg-secondary text-muted-foreground text-sm hover:bg-border transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeLinkPopup;